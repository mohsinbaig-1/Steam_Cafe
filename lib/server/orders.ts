import type { Fulfillment } from "@/types";
import { isRecord } from "@/lib/server/api";

export const DELIVERY_FEE = 100;

export type OrderInput = {
  items: Array<{ productId: number; quantity: number }>;
  fulfillment: Fulfillment;
  paymentMethod: "cash" | "card";
  notes: string;
};

export class OrderInputError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "OrderInputError";
  }
}

export class InventoryError extends Error {
  readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = "InventoryError";
  }
}

function requiredString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new OrderInputError(`${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function parseFulfillment(value: unknown): Fulfillment {
  if (!isRecord(value) || (value.type !== "delivery" && value.type !== "pickup")) {
    throw new OrderInputError("Fulfillment must be delivery or pickup.");
  }

  if (value.type === "delivery") {
    return {
      type: "delivery",
      name: requiredString(value.name, "Fulfillment name", 120),
      phone: requiredString(value.phone, "Fulfillment phone", 40),
      address: requiredString(value.address, "Fulfillment address", 300),
      city: requiredString(value.city, "Fulfillment city", 100),
      area: typeof value.area === "string" ? value.area.trim().slice(0, 100) : ""
    };
  }

  return {
    type: "pickup",
    branch: requiredString(value.branch, "Pickup branch", 100)
  };
}

export function parseOrderInput(value: unknown): OrderInput {
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length === 0 || value.items.length > 50) {
    throw new OrderInputError("Items must contain between 1 and 50 products.");
  }

  const items = value.items.map((item) => {
    if (!isRecord(item) || typeof item.productId !== "number" || !Number.isInteger(item.productId) ||
      item.productId < 1 || typeof item.quantity !== "number" || !Number.isInteger(item.quantity) ||
      item.quantity < 1 || item.quantity > 100) {
      throw new OrderInputError("Each item must contain a valid productId and quantity from 1 to 100.");
    }
    return { productId: item.productId, quantity: item.quantity };
  });

  const uniqueProductIds = new Set(items.map((item) => item.productId));
  if (uniqueProductIds.size !== items.length) {
    throw new OrderInputError("Each product may appear only once in an order.");
  }

  if (value.paymentMethod !== "cash" && value.paymentMethod !== "card") {
    throw new OrderInputError("Payment method must be cash or card.");
  }

  return {
    items,
    fulfillment: parseFulfillment(value.fulfillment),
    paymentMethod: value.paymentMethod,
    notes: typeof value.notes === "string" ? value.notes.trim().slice(0, 1000) : ""
  };
}

export function parseProductId(value: string) {
  const productId = Number(value);
  if (!Number.isInteger(productId) || productId < 1) {
    throw new OrderInputError("Product ID must be a positive integer.");
  }
  return productId;
}
