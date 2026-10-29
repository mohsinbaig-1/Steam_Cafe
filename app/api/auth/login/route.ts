import { connectToDatabase } from "@/lib/server/db";
import { handleApiError, isRecord, jsonError } from "@/lib/server/api";
import { comparePassword, hashPassword } from "@/lib/server/passwords";
import { signUserToken } from "@/lib/server/auth";
import { isValidEmail } from "@/lib/validation";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureAdminUser() {
  const adminEmail = "admin@steamcafe.com";
  const existing = await UserModel.findOne({ email: adminEmail });

  if (!existing) {
    // No admin user at all — create one
    const passwordHash = await hashPassword("admin123");
    await UserModel.create({
      fullName: "Steam Cafe Admin",
      email: adminEmail,
      phone: "03001234567",
      passwordHash,
      role: "admin"
    });
  } else if (!existing.passwordHash || existing.role !== "admin") {
    // User exists but has missing hash or wrong role — repair it
    const passwordHash = existing.passwordHash || await hashPassword("admin123");
    await UserModel.updateOne(
      { _id: existing._id },
      { $set: { role: "admin", passwordHash } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return jsonError("Request body must be a valid JSON object.", 400);
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const errors: Record<string, string> = {};
    if (!email || !isValidEmail(email)) errors.email = "A valid email address is required.";
    if (!password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      return jsonError("Validation failed.", 400, errors);
    }

    await connectToDatabase();
    await UserModel.init();
    await ensureAdminUser();

    const user = await UserModel.findOne({ email });
    if (!user) {
      return Response.json(
        { error: "Invalid email or password.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return Response.json(
        { error: "Invalid email or password.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const token = await signUserToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    return Response.json(
      {
        token,
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role || "customer"
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
