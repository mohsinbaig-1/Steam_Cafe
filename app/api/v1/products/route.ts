import { connectToDatabase } from "@/lib/server/db";
import { handleApiError } from "@/lib/server/api";
import { ProductModel } from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const category = new URL(request.url).searchParams.get("category");
    const filter = category ? { category, available: true } : { available: true };
    const products = await ProductModel.find(filter).sort({ productId: 1 }).lean();
    return Response.json(products.map((product) => ({ ...product, id: product.productId })));
  } catch (error) {
    return handleApiError(error);
  }
}
