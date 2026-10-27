import { authenticateRequest, requireRole } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { InventoryModel } from "@/models/Inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    requireRole(user, "staff", "admin");
    await connectToDatabase();
    const inventory = await InventoryModel.find().sort({ productId: 1 }).lean();
    return Response.json(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}
