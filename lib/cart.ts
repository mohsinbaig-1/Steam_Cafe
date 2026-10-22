import { CartItem } from "@/types";

export const CART_KEY = "steamCafeCart";
export const ORDERS_KEY = "steamCafeOrders";
export const DELIVERY_FEE = 100;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.id === "number" && Number.isFinite(item.id) &&
    typeof item.name === "string" && typeof item.price === "number" &&
    Number.isFinite(item.price) && typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) && item.quantity > 0;
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "null");
    return Array.isArray(value) ? value.filter(isCartItem) : [];
  } catch (error) {
    console.error("Unable to read the saved cart.", error);
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function itemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function subtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export const money = (value: number) => `Rs. ${value.toLocaleString()}`;
