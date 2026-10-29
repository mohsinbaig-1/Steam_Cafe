/**
 * Full catalog + inventory seeder
 * Run: node scripts/seed-all.mjs
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
console.log("✅ Connected to:", process.env.MONGODB_DB_NAME ?? "steam_cafe");

const db = mongoose.connection.db;

// ── All 16 products ──────────────────────────────────────────────────────────
const products = [
  { id: 1,  name: "Steam Zinger Burger",   category: "burgers", price: 499, rating: 4.9, badge: "Popular",    emoji: "🍔", description: "Crispy chicken fillet, fresh lettuce and signature sauce." },
  { id: 2,  name: "Steam Beef Burger",     category: "burgers", price: 599, rating: 4.8, badge: "Bestseller", emoji: "🍔", description: "Juicy beef patty with cheese, lettuce and special sauce." },
  { id: 3,  name: "Cheese Blast Burger",   category: "burgers", price: 549, rating: 4.7, badge: "New",        emoji: "🍔", description: "Crispy chicken burger loaded with melted cheese." },
  { id: 4,  name: "Double Beef Burger",    category: "burgers", price: 749, rating: 4.9, badge: "Premium",    emoji: "🍔", description: "Two juicy beef patties with double cheese." },
  { id: 5,  name: "Steam Special Pizza",   category: "pizza",   price: 899, rating: 4.8, badge: "Popular",    emoji: "🍕", description: "Loaded pizza with chicken, cheese and fresh toppings." },
  { id: 6,  name: "Chicken Fajita Pizza",  category: "pizza",   price: 999, rating: 4.8, badge: "",           emoji: "🍕", description: "Spicy chicken fajita with peppers and mozzarella." },
  { id: 7,  name: "Cheese Lovers Pizza",   category: "pizza",   price: 949, rating: 4.7, badge: "New",        emoji: "🍕", description: "A delicious combination of premium melted cheeses." },
  { id: 8,  name: "Crispy Chicken",        category: "chicken", price: 599, rating: 4.7, badge: "Popular",    emoji: "🍗", description: "Golden crispy chicken with our special seasoning." },
  { id: 9,  name: "Chicken Wings",         category: "chicken", price: 499, rating: 4.8, badge: "",           emoji: "🍗", description: "Crispy and spicy chicken wings." },
  { id: 10, name: "Chicken Strips",        category: "chicken", price: 449, rating: 4.6, badge: "",           emoji: "🍗", description: "Tender crispy chicken strips with dip." },
  { id: 11, name: "Loaded Fries",          category: "fries",   price: 399, rating: 4.8, badge: "Popular",    emoji: "🍟", description: "Crispy fries loaded with cheese and special sauce." },
  { id: 12, name: "Masala Fries",          category: "fries",   price: 299, rating: 4.6, badge: "",           emoji: "🍟", description: "Crispy fries with our signature spicy masala." },
  { id: 13, name: "Cheese Fries",          category: "fries",   price: 349, rating: 4.7, badge: "New",        emoji: "🍟", description: "Golden fries topped with melted cheese." },
  { id: 14, name: "Cold Drink",            category: "drinks",  price: 120, rating: 4.5, badge: "",           emoji: "🥤", description: "Chilled soft drink." },
  { id: 15, name: "Fresh Lemonade",        category: "drinks",  price: 180, rating: 4.8, badge: "Popular",    emoji: "🍋", description: "Freshly prepared chilled lemonade." },
  { id: 16, name: "Chocolate Shake",       category: "drinks",  price: 299, rating: 4.9, badge: "Bestseller", emoji: "🥤", description: "Creamy chocolate shake." },
];

let seeded = 0;
let inventorySeeded = 0;

for (const p of products) {
  // Upsert product (always mark available: true)
  const r = await db.collection("products").updateOne(
    { productId: p.id },
    {
      $set: {
        productId: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        rating: p.rating,
        badge: p.badge,
        emoji: p.emoji,
        description: p.description,
        available: true
      }
    },
    { upsert: true }
  );
  if (r.upsertedCount > 0 || r.modifiedCount > 0) seeded++;

  // Upsert inventory — always ensure at least 100 stock
  const inv = await db.collection("inventories").updateOne(
    { productId: p.id },
    { $max: { availableQuantity: 100 } },   // only increase, never decrease
    { upsert: true }
  );
  if (inv.upsertedCount > 0 || inv.modifiedCount > 0) inventorySeeded++;
}

console.log(`✅ Products seeded/updated: ${seeded} / ${products.length}`);
console.log(`✅ Inventory seeded/updated: ${inventorySeeded} / ${products.length}`);

// Final check
const totalProducts = await db.collection("products").countDocuments({ available: true });
const totalInventory = await db.collection("inventories").countDocuments({ availableQuantity: { $gt: 0 } });
console.log(`\n📊 Final state:`);
console.log(`   Available products: ${totalProducts}`);
console.log(`   In-stock inventory: ${totalInventory}`);

await mongoose.disconnect();
console.log("\n🎉 Done! All products are now available. Try placing your order.");

