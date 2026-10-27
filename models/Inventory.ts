import { model, models, Schema } from "mongoose";

const inventorySchema = new Schema(
  {
    productId: { type: Number, required: true, unique: true, index: true },
    availableQuantity: { type: Number, required: true, min: 0 }
  },
  { timestamps: true, collection: "inventory" }
);

export const InventoryModel = models.Inventory || model("Inventory", inventorySchema);
