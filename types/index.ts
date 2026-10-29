export type ProductCategory = "burgers" | "pizza" | "chicken" | "fries" | "drinks";

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  rating: number;
  badge: string;
  emoji: string;
  description: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  emoji?: string;
}

export interface Fulfillment {
  type: "delivery" | "pickup";
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  area?: string;
  branch?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: Fulfillment;
  paymentMethod: string;
  notes: string;
  status: string;
  createdAt: string;
}

export interface AuthUser {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: "customer" | "staff" | "admin";
}
