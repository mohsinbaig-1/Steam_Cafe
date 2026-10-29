/**
 * Fixes the admin user - sets a fresh bcrypt hash for admin123
 * Run: node scripts/fix-admin.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const req = createRequire(import.meta.url);

// Load .env.local
for (const line of fs.readFileSync(path.join(rootDir, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const mongoose = req(path.join(rootDir, "node_modules/mongoose"));
const bcrypt = req(path.join(rootDir, "services/auth-service/node_modules/bcrypt"));

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME ?? "steam_cafe",
  serverSelectionTimeoutMS: 5000
});
console.log("✅ Connected to MongoDB");

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  passwordHash: String,
  role: String,
}, { timestamps: true, collection: "users" });
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

// Hash a fresh password
const hash = await bcrypt.hash("admin123", 12);
console.log("✅ Generated new bcrypt hash");

// Update or create admin
const result = await UserModel.findOneAndUpdate(
  { email: "admin@steamcafe.com" },
  {
    $set: {
      fullName: "Steam Cafe Admin",
      email: "admin@steamcafe.com",
      phone: "03001234567",
      passwordHash: hash,
      role: "admin"
    }
  },
  { upsert: true, new: true }
);

console.log("✅ Admin user fixed!");
console.log("   Email:", result.email);
console.log("   Role:", result.role);
console.log("   Hash present:", Boolean(result.passwordHash));

// Verify it works
const ok = await bcrypt.compare("admin123", result.passwordHash);
console.log("✅ Password verify:", ok ? "PASS ✅" : "FAIL ❌");

await mongoose.disconnect();
console.log("\n🎉 Done! You can now login with:");
console.log("   Email:    admin@steamcafe.com");
console.log("   Password: admin123");

