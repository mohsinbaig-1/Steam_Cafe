import { handleApiError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { parseProductId } from "@/lib/server/orders";
import { ProductModel } from "@/models/Product";
import { getOrSetCache } from "@/lib/server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseProductId(params.id);
    const cacheKey = `cache:product:${productId}`;

    const product = await getOrSetCache(
      cacheKey,
      async () => {
        await connectToDatabase();
        const found = await ProductModel.findOne({
          productId,
          available: true
        }).lean();

        if (!found) return null;
        return { ...found, id: found.productId };
      },
      300 // 5 minutes cache TTL
    );

    if (!product) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}
