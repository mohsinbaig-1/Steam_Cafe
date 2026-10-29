/**
 * Quick test: simulate what /api/auth/login does locally.
 * Run with: node scripts/test-login.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// ── 1. Load .env.local ─────────────────────────────────────────────────────
import fs from "fs";
const envFile = path.join(rootDir, ".env.local");
for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

// ── 2. Check MongoDB connection ────────────────────────────────────────────
console.log("MONGODB_URI =", process.env.MONGODB_URI);
console.log("JWT_SECRET  =", process.env.JWT_SECRET ? "[SET]" : "[MISSING]");

const mongoose = createRequire(import.meta.url)(path.join(rootDir, "node_modules/mongoose"));

try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME ?? "steam_cafe", serverSelectionTimeoutMS: 4000 });
  console.log("✅ MongoDB connected OK");
} catch (e) {
  console.error("❌ MongoDB connection FAILED:", e.message);
  process.exit(1);
}

// ── 3. Check bcrypt loads ──────────────────────────────────────────────────
let bcrypt;
try {
  const bcryptPath = path.join(rootDir, "services/auth-service/node_modules/bcrypt");
  bcrypt = createRequire(import.meta.url)(bcryptPath);
  console.log("✅ bcrypt loaded OK");
} catch (e) {
  console.error("❌ bcrypt load FAILED:", e.message);
  await mongoose.disconnect();
  process.exit(1);
}

// ── 4. Check if admin user exists ─────────────────────────────────────────
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  passwordHash: String,
  role: String,
}, { timestamps: true, collection: "users" });
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

const admin = await UserModel.findOne({ email: "admin@steamcafe.com" });
if (!admin) {
  console.log("⚠️  No admin@steamcafe.com found in DB — will be auto-created on first login request");
} else {
  console.log("✅ Admin user found. Role:", admin.role);

  // ── 5. Test password compare ───────────────────────────────────────────
  try {
    const match = await bcrypt.compare("admin123", admin.passwordHash);
    console.log(match ? "✅ Password 'admin123' matches" : "❌ Password 'admin123' does NOT match hash in DB");
  } catch (e) {
    console.error("❌ bcrypt.compare failed:", e.message);
  }
}

await mongoose.disconnect();
console.log("Done.");

