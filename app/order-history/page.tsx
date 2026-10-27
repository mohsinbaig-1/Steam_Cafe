"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/cart";
import { readOrders } from "@/lib/orders";
import { Fulfillment, Order } from "@/types";

interface ApiOrderItem {
  productId?: number;
  id?: number;
  name: string;
  unitPrice?: number;
  price?: number;
  quantity: number;
  emoji?: string;
}

interface ApiOrder {
  _id?: string;
  id?: string;
  items?: ApiOrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  fulfillment?: Fulfillment;
  paymentMethod?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
}

const filters = ["all", "pending", "preparing", "completed", "cancelled"];
const normalizedStatus = (status: string) => {
  const value = status.toLowerCase();
  if (value === "preparing") return value;
  if (["completed", "delivered", "complete"].includes(value)) return "completed";
  if (["cancelled", "canceled", "cancel"].includes(value)) return "cancelled";
  return "pending";
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const token = typeof window !== "undefined" ? window.sessionStorage.getItem("steamCafeAuthToken") : null;
      if (token) {
        try {
          const res = await fetch("/api/v1/orders", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data: unknown = await res.json();
            if (Array.isArray(data)) {
              const mapped: Order[] = (data as ApiOrder[]).map((d) => ({
                id: d._id?.toString() || d.id || "SC-ORDER",
                items: (d.items || []).map((it) => ({
                  id: it.productId || it.id || 0,
                  name: it.name || "Item",
                  price: it.unitPrice ?? it.price ?? 0,
                  quantity: it.quantity || 1,
                  emoji: it.emoji ?? "🍔"
                })),
                subtotal: d.subtotal ?? 0,
                deliveryFee: d.deliveryFee ?? 0,
                total: d.total ?? 0,
                fulfillment: d.fulfillment || { type: "delivery" },
                paymentMethod: d.paymentMethod || "cash",
                notes: d.notes || "",
                status: d.status || "Pending",
                createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString()
              }));
              setOrders(mapped);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to fetch cloud orders:", e);
        }
      }

      setOrders(readOrders());
      setLoading(false);
    }

    loadOrders();
  }, []);

  const visible = orders.filter((order) => filter === "all" || normalizedStatus(order.status) === filter).slice().reverse();

  return (
    <main className="history-page">
      <section className="history-hero">
        <div className="container">
          <span className="section-tag">STEAM CAFE</span>
          <h1>Your Order History</h1>
          <p>Review your previous orders and their details, synced with your Steam Cafe account.</p>
        </div>
      </section>
      <section className="history-content container">
        <div className="history-toolbar">
          <div>
            <span className="section-label">YOUR ORDERS</span>
            <h2>Recent orders</h2>
          </div>
          <div className="order-filters" role="group" aria-label="Filter orders">
            {filters.map((value) => (
              <button
                type="button"
                key={value}
                className={`filter-button ${filter === value ? "active" : ""}`}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All Orders" : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-history">
            <p>Loading your orders...</p>
          </div>
        ) : (
          <div className="order-history-list">
            {visible.map((order) => (
              <article className={`order-card ${expanded === order.id ? "expanded" : ""}`} key={order.id}>
                <div className="order-card-header">
                  <div>
                    <h3>{order.id}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`status-badge ${normalizedStatus(order.status)}`}>{normalizedStatus(order.status)}</span>
                </div>
                <div className="order-card-summary">
                  <span>{order.items.reduce((total, item) => total + item.quantity, 0)} items</span>
                  <span>{order.fulfillment.type === "pickup" ? "Pickup" : "Delivery"}</span>
                  <strong className="order-total">{money(order.total)}</strong>
                </div>
                <div className="order-card-footer">
                  <span>Order details</span>
                  <button
                    className="details-button"
                    type="button"
                    aria-expanded={expanded === order.id}
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    {expanded === order.id ? "Hide Details" : "View Details"}
                  </button>
                </div>
                <div className="order-details">
                  <h4>Items</h4>
                  {order.items.map((item) => (
                    <div className="order-item" key={item.id}>
                      <div>
                        <div className="order-item-name">{item.name}</div>
                        <div className="order-item-meta">Qty: {item.quantity}</div>
                      </div>
                      <strong className="order-item-price">{money(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                  <div className="order-summary">
                    <SummaryRow label="Subtotal" value={money(order.subtotal)} />
                    <SummaryRow label="Delivery fee" value={money(order.deliveryFee)} />
                    <SummaryRow label="Total" value={money(order.total)} total />
                  </div>
                  <div className="order-info">
                    <div className="order-info-row">
                      <span>Fulfillment</span>
                      <strong>{order.fulfillment.type === "pickup" ? "Pickup" : "Delivery"}</strong>
                    </div>
                    <div className="order-info-row">
                      <span>Payment</span>
                      <strong>{order.paymentMethod}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !visible.length && (
          <div className="empty-history">
            <div className="empty-icon"><i className="fa-solid fa-receipt" /></div>
            <h2>{orders.length ? "No matching orders" : "No orders yet"}</h2>
            <p>{orders.length ? "Try another status filter to find your saved orders." : "Your orders will appear here after you place your first order."}</p>
            <div className="empty-actions">
              <Link className="btn btn-primary" href="/menu">Explore the Menu <i className="fa-solid fa-arrow-right" /></Link>
              <Link className="btn btn-secondary" href="/">Back to Home</Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryRow({ label, value, total = false }: { label: string; value: string; total?: boolean }) {
  return (
    <div className={`summary-row ${total ? "total" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
