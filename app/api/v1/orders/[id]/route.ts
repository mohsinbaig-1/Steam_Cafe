import { Types } from "mongoose";
import { authenticateRequest, requireRole } from "@/lib/server/auth";
import { handleApiError, isRecord, jsonError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { OrderModel } from "@/models/Order";
import { getOrSetCache, deleteCache, setCache } from "@/lib/server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError("Order ID is invalid.", 400);
    }

    const cacheKey = `cache:order:${params.id}`;
    const order = await getOrSetCache(
      cacheKey,
      async () => {
        await connectToDatabase();
        const filter = user.role === "staff" || user.role === "admin"
          ? { _id: params.id }
          : { _id: params.id, userId: user.id };
        return OrderModel.findOne(filter).lean();
      },
      60 // 1 minute cache for order tracking status
    );

    if (!order) return jsonError("Order not found.", 404);

    // Security check: ensure non-staff users cannot access other users' orders from cache
    if (user.role !== "staff" && user.role !== "admin" && (order as { userId?: string }).userId !== user.id) {
      return jsonError("Order not found.", 404);
    }

    return Response.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    requireRole(user, "staff", "admin");

    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError("Order ID is invalid.", 400);
    }

    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.status !== "string") {
      return jsonError("Status is required and must be a string.", 400);
    }

    const allowedStatuses = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(body.status)) {
      return jsonError(`Status must be one of: ${allowedStatuses.join(", ")}`, 400);
    }

    await connectToDatabase();
    const updated = await OrderModel.findByIdAndUpdate(
      params.id,
      { $set: { status: body.status } },
      { new: true }
    ).lean();

    if (!updated) {
      return jsonError("Order not found.", 404);
    }

    // Invalidate and refresh cache for this order and user's order list
    const orderId = params.id;
    await Promise.all([
      deleteCache(`cache:order:${orderId}`),
      deleteCache(`cache:orders:user:${(updated as { userId?: string }).userId}`)
    ]);

    // Update with fresh data
    await setCache(`cache:order:${orderId}`, updated, 60);

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
