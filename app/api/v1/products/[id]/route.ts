import { handleApiError } from "@/lib/server/api";
import { connectToDatabase } from "@/lib/server/db";
import { parseProductId } from "@/lib/server/orders";
import { ProductModel } from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const product = await ProductModel.findOne({
      productId: parseProductId(params.id),
      available: true
    }).lean();

    if (!product) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    return Response.json({ ...product, id: product.productId });
  } catch (error) {
    return handleApiError(error);
  }
}
