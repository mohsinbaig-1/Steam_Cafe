import mongoose from "mongoose";
import { authenticateRequest } from "@/lib/server/auth";
import { handleApiError, isRecord, jsonError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { InventoryError, OrderInputError, DELIVERY_FEE, parseOrderInput } from "@/lib/server/orders";
import { InventoryModel } from "@/models/Inventory";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { products as defaultProducts } from "@/lib/products";
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  getOrSetCache,
  acquireDistributedLock,
  releaseDistributedLock,
  checkRateLimit
} from "@/lib/server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureCatalogAndInventory() {
  const count = await ProductModel.countDocuments();
  if (count < defaultProducts.length) {
    for (const p of defaultProducts) {
      await ProductModel.updateOne(
        { productId: p.id },
        {
          $setOnInsert: {
            productId: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            rating: p.rating,
            badge: p.badge || "",
            emoji: p.emoji,
            description: p.description,
            available: true
          }
        },
        { upsert: true }
      );
      await InventoryModel.updateOne(
        { productId: p.id },
        { $setOnInsert: { availableQuantity: 100 } },
        { upsert: true }
      );
    }
  }
}

function isTransactionUnsupported(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("replica set") ||
      msg.includes("transactions are not supported") ||
      msg.includes("transaction numbers are only allowed") ||
      ("codeName" in error && (error as { codeName?: string }).codeName === "IllegalOperation") ||
      ("code" in error && (error as { code?: number }).code === 20)
    );
  }
  return false;
}

function readIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value || value.length > 255) {
    throw new OrderInputError("Idempotency-Key must be between 1 and 255 characters.");
  }
  return value;
}

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);

    // If customer, utilize Redis cache-aside (30s TTL)
    if (user.role !== "staff" && user.role !== "admin") {
      const userOrders = await getOrSetCache(
        `cache:orders:user:${user.id}`,
        async () => {
          await connectToDatabase();
          return OrderModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
        },
        30
      );
      return Response.json(userOrders);
    }

    // Staff/Admin gets live orders
    await connectToDatabase();
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    return Response.json(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  let lockKey: string | null = null;
  let lockAcquired = false;

  try {
    const user = await authenticateRequest(request);

    // 1. Rate Limiting Protection (max 10 checkout attempts per minute per user)
    const rateCheck = await checkRateLimit(`ratelimit:orders:${user.id}`, 10, 60);
    if (!rateCheck.allowed) {
      return jsonError("Too many order requests. Please try again shortly.", 429);
    }

    const idempotencyKey = readIdempotencyKey(request);
    const idempotencyCacheKey = `order:idempotency:${user.id}:${idempotencyKey}`;

    // 2. High-Speed Idempotency Cache Check via Redis
    const cachedOrder = await getCache(idempotencyCacheKey);
    if (cachedOrder) {
      return Response.json(cachedOrder, { status: 200 });
    }

    // 3. Distributed Lock to prevent duplicate concurrent submissions
    lockKey = `lock:order:${user.id}:${idempotencyKey}`;
    lockAcquired = await acquireDistributedLock(lockKey, 15);
    if (!lockAcquired) {
      return jsonError("Your order is currently being processed. Please wait a moment.", 409);
    }

    const body: unknown = await request.json();
    const input = parseOrderInput(body);

    await connectToDatabase();
    await OrderModel.init();
    await ensureCatalogAndInventory();

    // Secondary DB check for idempotency
    const existing = await OrderModel.findOne({
      userId: user.id,
      idempotencyKey
    }).lean();
    if (existing) {
      await setCache(idempotencyCacheKey, existing, 86400);
      return Response.json(existing, { status: 200 });
    }

    const processOrder = async (session?: mongoose.ClientSession) => {
      const opts = session ? { session } : {};
      const products = await ProductModel.find(
        {
          productId: { $in: input.items.map((item) => item.productId) },
          available: true
        },
        null,
        opts
      ).lean();

      if (products.length !== input.items.length) {
        throw new InventoryError("One or more products are unavailable.");
      }

      const productById = new Map(products.map((product) => [product.productId, product]));
      const orderItems = input.items.map((item) => {
        const product = productById.get(item.productId);
        if (!product) throw new InventoryError("One or more products are unavailable.");
        return {
          productId: product.productId,
          name: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity
        };
      });

      // Sort items by productId to prevent deadlocks across concurrent transactions
      for (const item of input.items.slice().sort((left, right) => left.productId - right.productId)) {
        const inventory = await InventoryModel.findOneAndUpdate(
          { productId: item.productId, availableQuantity: { $gte: item.quantity } },
          { $inc: { availableQuantity: -item.quantity } },
          { new: true, ...opts }
        );
        if (!inventory) {
          throw new InventoryError(`Product ${item.productId} is out of stock.`);
        }
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const deliveryFee = input.fulfillment.type === "delivery" ? DELIVERY_FEE : 0;
      const [order] = await OrderModel.create(
        [{
          userId: user.id,
          idempotencyKey,
          items: orderItems,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          fulfillment: input.fulfillment,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          status: "Pending"
        }],
        opts
      );
      return order;
    };

    let createdOrder: any = null;
    let session: mongoose.ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        createdOrder = await processOrder(session!);
      });
    } catch (transactionError) {
      if (isTransactionUnsupported(transactionError)) {
        // Fallback for standalone MongoDB deployments without replica set
        createdOrder = await processOrder();
      } else if (isRecord(transactionError) && transactionError.code === 11000) {
        const existingOrder = await OrderModel.findOne({ userId: user.id, idempotencyKey }).lean();
        if (existingOrder) {
          await setCache(idempotencyCacheKey, existingOrder, 86400);
          return Response.json(existingOrder, { status: 200 });
        }
      } else {
        throw transactionError;
      }
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    // 4. Update Caches upon successful order creation
    if (createdOrder) {
      const orderData = createdOrder.toObject ? createdOrder.toObject() : createdOrder;
      // Cache response under idempotency key for 24h
      await setCache(idempotencyCacheKey, orderData, 86400);

      // Invalidate user orders cache and inventory caches
      const invalidations: Promise<unknown>[] = [
        deleteCache(`cache:orders:user:${user.id}`),
        deleteCache("cache:inventory:all")
      ];
      for (const item of input.items) {
        invalidations.push(deleteCache(`cache:inventory:${item.productId}`));
      }
      await Promise.all(invalidations);

      return Response.json(orderData, { status: 201 });
    }

    return jsonError("Failed to create order.", 500);
  } catch (error) {
    return handleApiError(error);
  } finally {
    if (lockKey && lockAcquired) {
      await releaseDistributedLock(lockKey);
    }
  }
}
