import { connectToDatabase } from "@/lib/server/db";
import { handleApiError, isRecord, jsonError } from "@/lib/server/api";
import { hashPassword } from "@/lib/server/passwords";
import { isValidEmail } from "@/lib/validation";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return jsonError("Request body must be a valid JSON object.", 400);
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const errors: Record<string, string> = {};
    if (!fullName) errors.fullName = "Full name is required.";
    if (!email || !isValidEmail(email)) errors.email = "A valid email address is required.";
    if (!phone) errors.phone = "Phone number is required.";
    if (!password || password.length < 6) errors.password = "Password must be at least 6 characters.";

    if (Object.keys(errors).length > 0) {
      return jsonError("Validation failed.", 400, errors);
    }

    await connectToDatabase();
    await UserModel.init();

    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists.", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      fullName,
      email,
      phone,
      passwordHash,
      role: "customer"
    });

    return Response.json(
      {
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role || "customer"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (isRecord(error) && error.code === 11000) {
      return Response.json(
        { error: "An account with this email already exists.", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}

