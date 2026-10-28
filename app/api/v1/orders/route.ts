import mongoose from "mongoose";
import { authenticateRequest } from "@/lib/server/auth";
import { handleApiError, isRecord } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { InventoryError, OrderInputError, DELIVERY_FEE, parseOrderInput } from "@/lib/server/orders";
import { InventoryModel } from "@/models/Inventory";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { products as defaultProducts } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureCatalogAndInventory() {
  const count = await ProductModel.countDocuments();
  if (count === 0) {
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
    await connectToDatabase();
    const filter = user.role === "staff" || user.role === "admin"
      ? {}
      : { userId: user.id };
    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();
    return Response.json(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const idempotencyKey = readIdempotencyKey(request);
    const body: unknown = await request.json();
    const input = parseOrderInput(body);

    await connectToDatabase();
    await OrderModel.init();
    await ensureCatalogAndInventory();

    const existing = await OrderModel.findOne({
      userId: user.id,
      idempotencyKey
    }).lean();
    if (existing) {
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

    let session: mongoose.ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      let createdOrder;
      await session.withTransaction(async () => {
        createdOrder = await processOrder(session!);
      });
      return Response.json(createdOrder, { status: 201 });
    } catch (transactionError) {
      if (isTransactionUnsupported(transactionError)) {
        // Fallback for standalone MongoDB deployments without replica set
        const createdOrder = await processOrder();
        return Response.json(createdOrder, { status: 201 });
      }
      if (isRecord(transactionError) && transactionError.code === 11000) {
        const existingOrder = await OrderModel.findOne({ userId: user.id, idempotencyKey }).lean();
        if (existingOrder) return Response.json(existingOrder, { status: 200 });
      }
      throw transactionError;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  } catch (error) {
    return handleApiError(error);
  }
}
