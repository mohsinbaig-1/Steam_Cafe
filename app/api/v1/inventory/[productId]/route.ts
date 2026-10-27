import { authenticateRequest, requireRole } from "@/lib/server/auth";
import { handleApiError, isRecord, jsonError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { parseProductId, OrderInputError } from "@/lib/server/orders";
import { InventoryModel } from "@/models/Inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    requireRole(user, "staff", "admin");
    const productId = parseProductId(params.productId);
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.availableQuantity !== "number" ||
      !Number.isInteger(body.availableQuantity) || body.availableQuantity < 0) {
      throw new OrderInputError("availableQuantity must be a non-negative integer.");
    }

    await connectToDatabase();
    const inventory = await InventoryModel.findOneAndUpdate(
      { productId },
      { $set: { availableQuantity: body.availableQuantity } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return Response.json(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    requireRole(user, "staff", "admin");
    await connectToDatabase();
    const inventory = await InventoryModel.findOne({ productId: parseProductId(params.productId) }).lean();
    if (!inventory) return jsonError("Inventory record not found.", 404);
    return Response.json(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}
