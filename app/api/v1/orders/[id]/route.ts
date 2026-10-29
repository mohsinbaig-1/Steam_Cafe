import { Types } from "mongoose";
import { authenticateRequest, requireRole } from "@/lib/server/auth";
import { handleApiError, isRecord, jsonError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { OrderModel } from "@/models/Order";

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

    await connectToDatabase();
    const filter = user.role === "staff" || user.role === "admin"
      ? { _id: params.id }
      : { _id: params.id, userId: user.id };
    const order = await OrderModel.findOne(filter).lean();
    if (!order) return jsonError("Order not found.", 404);
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

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
