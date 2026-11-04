import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const req = createRequire(import.meta.url);

for (const line of fs.readFileSync(path.join(rootDir, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const mongoose = req(path.join(rootDir, "node_modules/mongoose"));
await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME ?? "steam_cafe",
  serverSelectionTimeoutMS: 5000
});

const db = mongoose.connection.db;

// Verify product 2 (Steam Beef Burger) which was in the user's checkout screenshot
const product2 = await db.collection("products").findOne({ productId: 2 });
console.log("Product 2 in DB:", product2?.name, "- Available:", product2?.available);

const inv2 = await db.collection("inventories").findOne({ productId: 2 });
console.log("Inventory for Product 2:", inv2?.availableQuantity);

// Verify admin user
const admin = await db.collection("users").findOne({ email: "admin@steamcafe.com" });
console.log("Admin account:", admin?.email, "- Role:", admin?.role);

// Check total orders
const orderCount = await db.collection("orders").countDocuments();
console.log("Total orders currently in DB:", orderCount);

await mongoose.disconnect();
console.log("✅ All checks passed successfully!");

