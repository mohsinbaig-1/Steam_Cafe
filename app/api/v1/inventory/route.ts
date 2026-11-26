import { authenticateRequest, requireRole } from "@/lib/server/auth";
import { handleApiError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { InventoryModel } from "@/models/Inventory";
import { getOrSetCache } from "@/lib/server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    requireRole(user, "staff", "admin");

    const inventory = await getOrSetCache(
      "cache:inventory:all",
      async () => {
        await connectToDatabase();
        return InventoryModel.find().sort({ productId: 1 }).lean();
      },
      60 // 1 minute TTL for staff inventory monitoring
    );

    return Response.json(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}
