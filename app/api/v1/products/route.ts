import { connectToDatabase } from "@/lib/server/db";
import { handleApiError } from "@/lib/server/api";
import { ProductModel } from "@/models/Product";
import { getOrSetCache } from "@/lib/server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const category = new URL(request.url).searchParams.get("category");
    const cacheKey = `cache:products:${category || "all"}`;

    const formattedProducts = await getOrSetCache(
      cacheKey,
      async () => {
        await connectToDatabase();
        const filter = category ? { category, available: true } : { available: true };
        const products = await ProductModel.find(filter).sort({ productId: 1 }).lean();
        return products.map((product) => ({ ...product, id: product.productId }));
      },
      300 // 5 minutes cache TTL
    );

    return Response.json(formattedProducts, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
