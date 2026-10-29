/**
 * Diagnose inventory issues and re-seed if needed.
 * Run: node scripts/fix-inventory.mjs
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

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME ?? "steam_cafe",
  serverSelectionTimeoutMS: 5000
});
console.log("✅ Connected to MongoDB:", process.env.MONGODB_DB_NAME ?? "steam_cafe");

const db = mongoose.connection.db;

// Check products
const products = await db.collection("products").find({}).toArray();
console.log("\n📦 Products in DB:", products.length);
if (products.length > 0) {
  const unavailable = products.filter(p => !p.available);
  console.log("  Available:", products.filter(p => p.available).length);
  console.log("  Unavailable:", unavailable.length);
  if (unavailable.length > 0) {
    console.log("  Unavailable IDs:", unavailable.map(p => p.productId));
  }
}

// Check inventory
const inventory = await db.collection("inventories").find({}).toArray();
console.log("\n📋 Inventory records:", inventory.length);
const zeroStock = inventory.filter(i => i.availableQuantity <= 0);
if (zeroStock.length > 0) {
  console.log("  ⚠️  Out-of-stock productIds:", zeroStock.map(i => i.productId));
}

// Fix: mark all products as available and reset low inventory
console.log("\n🔧 Fixing: marking all products available + resetting inventory to 100...");

const productResult = await db.collection("products").updateMany(
  {},
  { $set: { available: true } }
);
console.log("  Products updated:", productResult.modifiedCount);

const invResult = await db.collection("inventories").updateMany(
  { availableQuantity: { $lt: 10 } },
  { $set: { availableQuantity: 100 } }
);
console.log("  Inventory records restocked:", invResult.modifiedCount);

// If no products at all, seed from defaults
if (products.length === 0) {
  console.log("\n🌱 No products found - seeding catalog...");
  // Try to read the products list
  const productListPath = path.join(rootDir, "lib/products.ts");
  const productListPathJs = path.join(rootDir, "lib/products.js");
  if (fs.existsSync(productListPath)) {
    console.log("  Found lib/products.ts - please run: npm run seed");
  } else if (fs.existsSync(productListPathJs)) {
    console.log("  Found lib/products.js - please run: npm run seed");
  } else {
    console.log("  Could not find products list - check lib/products.ts");
  }
}

await mongoose.disconnect();
console.log("\n✅ Done! Try placing an order now.");

