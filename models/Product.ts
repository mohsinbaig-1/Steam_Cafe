import { model, models, Schema } from "mongoose";

const productSchema = new Schema(
  {
    productId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["burgers", "pizza", "chicken", "fries", "drinks"],
      required: true
    },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0 },
    badge: { type: String, default: "" },
    emoji: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "products" }
);

export const ProductModel = models.Product || model("Product", productSchema);
