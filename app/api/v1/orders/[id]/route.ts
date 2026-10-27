import { Types } from "mongoose";
import { authenticateRequest } from "@/lib/server/auth";
import { handleApiError, jsonError } from "@/lib/server/api";
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
