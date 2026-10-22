"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/cart";
import { readOrders } from "@/lib/orders";
import { Order } from "@/types";

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { const orders = readOrders(); setOrder(orders.at(-1) ?? null); }, []);
  return <main className="success-page"><div className="success-container"><div className="success-icon"><i className="fa-solid fa-check" /></div><span className="section-tag">STEAM CAFE</span><h1>Order Confirmed!</h1><p className="success-message">Thank you for ordering from Steam Cafe. Your order has been received successfully.</p><div className="order-id-box"><span>ORDER NUMBER</span><strong>{order?.id ?? "No recent order"}</strong></div><div className="order-status"><StatusStep icon="fa-receipt" label="Order Placed" active /><div className="status-line" /><StatusStep icon="fa-fire-burner" label="Preparing" /><div className="status-line" /><StatusStep icon="fa-motorcycle" label="On the Way" /><div className="status-line" /><StatusStep icon="fa-house" label="Delivered" /></div><div className="order-details-card"><div className="details-header"><div><span className="section-tag">ORDER DETAILS</span><h2>Your Order</h2></div><span className="status-badge">{order?.status ?? "Pending"}</span></div><div className="order-items">{order ? order.items.map((item) => <div className="order-item" key={item.id}><div className="order-item-image">{item.emoji ?? "🍔"}</div><div className="order-item-info"><strong>{item.name}</strong><span>Quantity: {item.quantity}</span></div><strong className="order-item-price">{money(item.price * item.quantity)}</strong></div>) : <p>No order information was found.</p>}</div><div className="details-divider" /><div className="detail-row"><span>Subtotal</span><strong>{money(order?.subtotal ?? 0)}</strong></div><div className="detail-row"><span>Delivery Fee</span><strong>{money(order?.deliveryFee ?? 0)}</strong></div><div className="details-divider" /><div className="detail-total"><span>Total</span><strong>{money(order?.total ?? 0)}</strong></div></div>{order && <div className="fulfillment-card"><div className="fulfillment-icon"><i className={`fa-solid ${order.fulfillment.type === "pickup" ? "fa-store" : "fa-motorcycle"}`} /></div><div className="fulfillment-info"><span className="section-tag">FULFILLMENT</span><h3>{order.fulfillment.type === "pickup" ? "Pickup" : "Delivery"}</h3><p>{order.fulfillment.type === "pickup" ? "Your order will be prepared for pickup from the selected Steam Cafe branch." : `Your order will be delivered to ${order.fulfillment.address}, ${order.fulfillment.city}.`}</p></div></div>}<div className="success-actions"><Link href="/menu" className="primary-btn"><i className="fa-solid fa-utensils" /> Order More</Link><Link href="/order-history" className="secondary-btn">View Order History</Link></div></div></main>;
}

function StatusStep({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return <div className={`status-step ${active ? "active" : ""}`}><div className="status-icon"><i className={`fa-solid ${icon}`} /></div><span>{label}</span></div>;
}
