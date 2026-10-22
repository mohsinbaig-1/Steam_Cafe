import { Order } from "@/types";
import { ORDERS_KEY } from "./cart";

export function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? "null");
    return Array.isArray(value) ? value.filter((order): order is Order => Boolean(order && typeof order === "object")) : [];
  } catch (error) {
    console.error("Unable to read saved orders.", error);
    return [];
  }
}

export function saveOrder(order: Order) {
  const orders = readOrders();
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders, order]));
}
