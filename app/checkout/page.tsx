"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { DELIVERY_FEE, money } from "@/lib/cart";
import { saveOrder } from "@/lib/orders";
import { isValidPhone } from "@/lib/validation";
import { Fulfillment } from "@/types";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState("cash");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", address: "", city: "", area: "", branch: "main", notes: "" });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = window.sessionStorage.getItem("steamCafeUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setDetails((current) => ({
            ...current,
            name: current.name || user.fullName || "",
            phone: current.phone || user.phone || ""
          }));
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const update = (key: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [key]: value }));
  const delivery = method === "delivery" && subtotal > 0 ? DELIVERY_FEE : 0;

  const placeOrder = async () => {
    if (!items.length) { setMessage("Your cart is empty."); return; }
    if (method === "delivery" && (!details.name || !details.phone || !details.address || !details.city || !isValidPhone(details.phone))) {
      setMessage("Please provide valid delivery information and a valid Pakistani phone number.");
      return;
    }

    const token = typeof window !== "undefined" ? window.sessionStorage.getItem("steamCafeAuthToken") : null;
    if (!token) {
      setMessage("Please log in first to place your order.");
      window.setTimeout(() => router.push("/login"), 1500);
      return;
    }

    setSubmitting(true);
    setMessage("Placing your order...");

    const fulfillment: Fulfillment = method === "delivery"
      ? { type: "delivery", name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim(), city: details.city.trim(), area: details.area.trim() }
      : { type: "pickup", branch: details.branch };

    const idempotencyKey = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          fulfillment,
          paymentMethod: payment,
          notes: details.notes.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order. Please try again.");
      }

      const createdId = data._id || data.id || `SC-${Date.now()}`;
      saveOrder({
        id: String(createdId),
        items,
        subtotal,
        deliveryFee: delivery,
        total: subtotal + delivery,
        fulfillment,
        paymentMethod: payment,
        notes: details.notes.trim(),
        status: data.status || "Pending",
        createdAt: data.createdAt || new Date().toISOString()
      });

      window.localStorage.removeItem("steamCafeCart");
      setMessage("Order placed successfully!");
      window.setTimeout(() => router.push("/order-success"), 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "An error occurred while placing order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="checkout-hero">
        <div className="checkout-hero-content">
          <span className="section-tag">STEAM CAFE</span>
          <h1>Checkout</h1>
          <p>Choose how you want to receive your order.</p>
        </div>
      </section>
      <section className="checkout-page">
        <div className="checkout-container">
          <section className="checkout-form">
            <div className="checkout-card">
              <div className="card-heading">
                <div className="heading-icon"><i className="fa-solid fa-truck" /></div>
                <div><span className="section-tag">FULFILLMENT</span><h2>Order Method</h2></div>
              </div>
              <div className="method-options">
                {(["delivery", "pickup"] as const).map((value) => (
                  <label className={`method-option ${method === value ? "active" : ""}`} key={value}>
                    <input type="radio" name="order-method" checked={method === value} onChange={() => setMethod(value)} />
                    <div className="method-icon"><i className={`fa-solid ${value === "delivery" ? "fa-motorcycle" : "fa-store"}`} /></div>
                    <div className="method-content">
                      <strong>{value === "delivery" ? "Delivery" : "Pickup"}</strong>
                      <span>{value === "delivery" ? "Get your order delivered to your address." : "Pick up your order from a Steam Cafe branch."}</span>
                    </div>
                    <i className="fa-solid fa-circle-check method-check" />
                  </label>
                ))}
              </div>
            </div>
            {method === "delivery" ? (
              <div className="checkout-card">
                <div className="card-heading">
                  <div className="heading-icon"><i className="fa-solid fa-location-dot" /></div>
                  <div><span className="section-tag">DELIVERY</span><h2>Delivery Information</h2></div>
                </div>
                <div className="form-grid">
                  {([["name", "Full Name", "Enter your full name"], ["phone", "Phone Number", "03XX XXXXXXX"], ["address", "Delivery Address", "House number, street, area..."], ["city", "City", "Your city"], ["area", "Area", "Your area"]] as const).map(([key, label, placeholder]) => (
                    <div className={`form-group ${key === "address" ? "full-width" : ""}`} key={key}>
                      <label htmlFor={key}>{label}</label>
                      {key === "address" ? (
                        <textarea id={key} rows={3} value={details[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} />
                      ) : (
                        <input id={key} value={details[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="checkout-card">
                <div className="card-heading">
                  <div className="heading-icon"><i className="fa-solid fa-store" /></div>
                  <div><span className="section-tag">PICKUP</span><h2>Select a branch</h2></div>
                </div>
                <div className="branch-options">
                  {[["main", "Steam Cafe - Main Branch", "Open today · 11:00 AM – 11:00 PM"], ["mall", "Steam Cafe - Mall Branch", "Open today · 11:00 AM – 12:00 AM"]].map(([value, label, text]) => (
                    <label className={`branch-option ${details.branch === value ? "active" : ""}`} key={value}>
                      <input type="radio" name="branch" checked={details.branch === value} onChange={() => update("branch", value)} />
                      <div><strong>{label}</strong><span>{text}</span></div>
                      <i className="fa-solid fa-circle-check" />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="checkout-card">
              <div className="card-heading">
                <div className="heading-icon"><i className="fa-solid fa-credit-card" /></div>
                <div><span className="section-tag">PAYMENT</span><h2>Payment method</h2></div>
              </div>
              <div className="payment-options">
                {[["cash", "Cash on delivery / pickup", "Pay when your order is ready."], ["card", "Card payment", "Payment integration is not connected yet."]].map(([value, label, text]) => (
                  <label className={`payment-option ${payment === value ? "active" : ""}`} key={value}>
                    <input type="radio" name="payment" checked={payment === value} onChange={() => setPayment(value)} />
                    <i className={`fa-solid ${value === "cash" ? "fa-money-bill" : "fa-credit-card"}`} />
                    <div><strong>{label}</strong><span>{text}</span></div>
                  </label>
                ))}
              </div>
            </div>
            <div className="checkout-card">
              <span className="section-tag">SPECIAL REQUESTS</span>
              <h2>Order notes</h2>
              <textarea className="order-notes" value={details.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Anything we should know?" />
            </div>
            {message && <p className={`checkout-message show ${message.includes("successfully") ? "success" : "error"}`} role="status">{message}</p>}
          </section>
          <aside className="checkout-summary">
            <div className="summary-header">
              <span className="section-tag">YOUR ORDER</span>
              <h2>Summary</h2>
            </div>
            {items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div className="checkout-item-image">{item.emoji ?? "🍔"}</div>
                <div className="checkout-item-info">
                  <strong>{item.name}</strong>
                  <span>Qty: {item.quantity}</span>
                </div>
                <strong className="checkout-item-price">{money(item.price * item.quantity)}</strong>
              </div>
            ))}
            <div className="summary-divider" />
            <div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div className="summary-row"><span>Delivery Fee</span><strong>{money(delivery)}</strong></div>
            <div className="summary-total"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div>
            <button className="place-order-btn" type="button" disabled={!items.length || submitting} onClick={placeOrder}>
              {submitting ? "Processing..." : <>Place Order <i className="fa-solid fa-check" /></>}
            </button>
            <Link href="/cart" className="back-to-cart"><i className="fa-solid fa-arrow-left" /> Back to cart</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
