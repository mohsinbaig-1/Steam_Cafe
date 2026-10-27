import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...values] = trimmed.split("=");
    if (key && !process.env[key.trim()]) {
      process.env[key.trim()] = values.join("=").trim();
    }
  }
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/steam_cafe";
const dbName = process.env.MONGODB_DB_NAME || "steam_cafe";

const products = [
  { productId: 1, name: "Steam Zinger Burger", category: "burgers", price: 499, rating: 4.9, badge: "Popular", emoji: "🍔", description: "Crispy chicken fillet, fresh lettuce and signature sauce.", available: true },
  { productId: 2, name: "Steam Beef Burger", category: "burgers", price: 599, rating: 4.8, badge: "Bestseller", emoji: "🍔", description: "Juicy beef patty with cheese, lettuce and special sauce.", available: true },
  { productId: 3, name: "Cheese Blast Burger", category: "burgers", price: 549, rating: 4.7, badge: "New", emoji: "🍔", description: "Crispy chicken burger loaded with melted cheese.", available: true },
  { productId: 4, name: "Double Beef Burger", category: "burgers", price: 749, rating: 4.9, badge: "Premium", emoji: "🍔", description: "Two juicy beef patties with double cheese.", available: true },
  { productId: 5, name: "Steam Special Pizza", category: "pizza", price: 899, rating: 4.8, badge: "Popular", emoji: "🍕", description: "Loaded pizza with chicken, cheese and fresh toppings.", available: true },
  { productId: 6, name: "Chicken Fajita Pizza", category: "pizza", price: 999, rating: 4.8, badge: "", emoji: "🍕", description: "Spicy chicken fajita with peppers and mozzarella.", available: true },
  { productId: 7, name: "Cheese Lovers Pizza", category: "pizza", price: 949, rating: 4.7, badge: "New", emoji: "🍕", description: "A delicious combination of premium melted cheeses.", available: true },
  { productId: 8, name: "Crispy Chicken", category: "chicken", price: 599, rating: 4.7, badge: "Popular", emoji: "🍗", description: "Golden crispy chicken with our special seasoning.", available: true },
  { productId: 9, name: "Chicken Wings", category: "chicken", price: 499, rating: 4.8, badge: "", emoji: "🍗", description: "Crispy and spicy chicken wings.", available: true },
  { productId: 10, name: "Chicken Strips", category: "chicken", price: 449, rating: 4.6, badge: "", emoji: "🍗", description: "Tender crispy chicken strips with dip.", available: true },
  { productId: 11, name: "Loaded Fries", category: "fries", price: 399, rating: 4.8, badge: "Popular", emoji: "🍟", description: "Crispy fries loaded with cheese and special sauce.", available: true },
  { productId: 12, name: "Masala Fries", category: "fries", price: 299, rating: 4.6, badge: "", emoji: "🍟", description: "Crispy fries with our signature spicy masala.", available: true },
  { productId: 13, name: "Cheese Fries", category: "fries", price: 349, rating: 4.7, badge: "New", emoji: "🍟", description: "Golden fries topped with melted cheese.", available: true },
  { productId: 14, name: "Cold Drink", category: "drinks", price: 120, rating: 4.5, badge: "", emoji: "🥤", description: "Chilled soft drink.", available: true },
  { productId: 15, name: "Fresh Lemonade", category: "drinks", price: 180, rating: 4.8, badge: "Popular", emoji: "🍋", description: "Freshly prepared chilled lemonade.", available: true },
  { productId: 16, name: "Chocolate Shake", category: "drinks", price: 299, rating: 4.9, badge: "Bestseller", emoji: "🥤", description: "Creamy chocolate shake.", available: true }
];

async function seed() {
  console.log(`Connecting to MongoDB at: ${uri}`);
  try {
    await mongoose.connect(uri, { dbName });
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");
    const inventoryCollection = db.collection("inventory");

    await productsCollection.createIndex({ productId: 1 }, { unique: true });
    await inventoryCollection.createIndex({ productId: 1 }, { unique: true });

    let productsUpserted = 0;
    let inventoryUpserted = 0;

    for (const product of products) {
      await productsCollection.updateOne(
        { productId: product.productId },
        { $set: product },
        { upsert: true }
      );
      productsUpserted++;

      await inventoryCollection.updateOne(
        { productId: product.productId },
        { $setOnInsert: { availableQuantity: 50 } },
        { upsert: true }
      );
      inventoryUpserted++;
    }

    console.log(`Successfully seeded ${productsUpserted} products and ensured inventory for ${inventoryUpserted} items.`);
  } catch (error) {
    console.error("Database seeding failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();

