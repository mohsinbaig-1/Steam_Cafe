import { model, models, Schema } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const fulfillmentSchema = new Schema(
  {
    type: { type: String, enum: ["delivery", "pickup"], required: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    area: { type: String, trim: true },
    branch: { type: String, trim: true }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    idempotencyKey: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    fulfillment: { type: fulfillmentSchema, required: true },
    paymentMethod: { type: String, enum: ["cash", "card"], required: true },
    notes: { type: String, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
      default: "Pending"
    }
  },
  { timestamps: true, collection: "orders" }
);

orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

export const OrderModel = models.Order || model("Order", orderSchema);
