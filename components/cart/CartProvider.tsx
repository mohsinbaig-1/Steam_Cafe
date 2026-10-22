"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, Product } from "@/types";
import { itemCount, readCart, saveCart, subtotal } from "@/lib/cart";

type CartContextValue = { items: CartItem[]; count: number; subtotal: number; add: (product: Product) => void; change: (id: number, amount: number) => void; remove: (id: number) => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => setItems(readCart()), []);
  const persist = (next: CartItem[]) => {
    setItems(next); saveCart(next); window.dispatchEvent(new Event("steam-cafe-cart-updated"));
  };
  const value = useMemo(() => ({
    items, count: itemCount(items), subtotal: subtotal(items),
    add: (product: Product) => {
      const existing = items.find((item) => item.id === product.id);
      persist(existing ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }]);
    },
    change: (id: number, amount: number) => persist(items.map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0)),
    remove: (id: number) => persist(items.filter((item) => item.id !== id))
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
