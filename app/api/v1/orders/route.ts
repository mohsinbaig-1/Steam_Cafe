import mongoose from "mongoose";
import { authenticateRequest } from "@/lib/server/auth";
import { handleApiError, isRecord } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { InventoryError, OrderInputError, DELIVERY_FEE, parseOrderInput } from "@/lib/server/orders";
import { InventoryModel } from "@/models/Inventory";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value || value.length > 255) {
    throw new OrderInputError("Idempotency-Key must be between 1 and 255 characters.");
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const idempotencyKey = readIdempotencyKey(request);
    const body: unknown = await request.json();
    const input = parseOrderInput(body);

    await connectToDatabase();
    await OrderModel.init();
    const existing = await OrderModel.findOne({
      userId: user.id,
      idempotencyKey
    }).lean();
    if (existing) {
      return Response.json(existing, { status: 200 });
    }

    const session = await mongoose.startSession();
    try {
      let createdOrder;
      await session.withTransaction(async () => {
        const products = await ProductModel.find({
          productId: { $in: input.items.map((item) => item.productId) },
          available: true
        }).session(session).lean();
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
            { new: true, session }
          );
          if (!inventory) {
            throw new InventoryError(`Product ${item.productId} is out of stock.`);
          }
        }

        const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const deliveryFee = input.fulfillment.type === "delivery" ? DELIVERY_FEE : 0;
        const [order] = await OrderModel.create([{
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
        }], { session });
        createdOrder = order;
      });

      return Response.json(createdOrder, { status: 201 });
    } catch (error) {
      if (isRecord(error) && error.code === 11000) {
        const existing = await OrderModel.findOne({ userId: user.id, idempotencyKey }).lean();
        if (existing) return Response.json(existing, { status: 200 });
      }
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
