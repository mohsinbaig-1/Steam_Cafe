"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/cart";
import { Fulfillment } from "@/types";

interface OrderItem {
  productId?: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface AdminOrder {
  _id: string;
  idempotencyKey?: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: Fulfillment | undefined;
  paymentMethod: "cash" | "card";
  notes?: string;
  status: "Pending" | "Preparing" | "Ready" | "Delivered" | "Cancelled";
  createdAt: string;
  updatedAt?: string;
}

const statusOptions = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"] as const;

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchOrders = async () => {
    if (typeof window === "undefined") return;
    const token = window.sessionStorage.getItem("steamCafeAuthToken");
    const rawUser = window.sessionStorage.getItem("steamCafeUser");

    if (!token || !rawUser) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      setUserRole(parsedUser.role || "customer");

      if (parsedUser.role !== "admin" && parsedUser.role !== "staff") {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/v1/orders", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch orders from server.");
      }

      const data: AdminOrder[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setError("");
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!autoRefresh || userRole !== "admin" && userRole !== "staff") return;
    const interval = window.setInterval(() => {
      fetchOrders();
    }, 15000); // Polling every 15 seconds for live orders
    return () => window.clearInterval(interval);
  }, [autoRefresh, userRole]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = typeof window !== "undefined" ? window.sessionStorage.getItem("steamCafeAuthToken") : null;
    if (!token) return;

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to update status.");
      }

      const updated: AdminOrder = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const preparing = orders.filter((o) => o.status === "Preparing").length;
    const ready = orders.filter((o) => o.status === "Ready").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    const revenue = orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { totalOrders, pending, preparing, ready, delivered, cancelled, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (fulfillmentFilter !== "all" && order.fulfillment?.type !== fulfillmentFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const customerName = order.fulfillment?.name?.toLowerCase() || "";
        const phone = order.fulfillment?.phone?.toLowerCase() || "";
        const city = order.fulfillment?.city?.toLowerCase() || "";
        const address = order.fulfillment?.address?.toLowerCase() || "";
        const branch = order.fulfillment?.branch?.toLowerCase() || "";
        const id = order._id.toLowerCase();
        const matchesQuery =
          customerName.includes(query) ||
          phone.includes(query) ||
          city.includes(query) ||
          address.includes(query) ||
          branch.includes(query) ||
          id.includes(query);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [orders, statusFilter, fulfillmentFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
      case "Preparing":
        return { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" };
      case "Ready":
        return { bg: "#f3e8ff", text: "#6b21a8", border: "#a855f7" };
      case "Delivered":
        return { bg: "#dcfce7", text: "#166534", border: "#22c55e" };
      case "Cancelled":
        return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" };
    }
  };

  if (!loading && (!userRole || (userRole !== "admin" && userRole !== "staff"))) {
    return (
      <main style={{ minHeight: "80vh", padding: "80px 20px", background: "#0b0b0b", color: "#fff" }}>
        <div style={{ maxWidth: "600px", margin: "auto", background: "#171717", padding: "40px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", color: "#f5a623", marginBottom: "16px" }}>
            <i className="fa-solid fa-lock" />
          </div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Admin Access Required</h1>
          <p style={{ color: "#a5a5a5", marginBottom: "24px", lineHeight: "1.6" }}>
            This page is restricted to Steam Cafe managers and staff. Please log in with your administrator account to view customer orders.
          </p>
          <div style={{ background: "#222", padding: "16px", borderRadius: "12px", marginBottom: "24px", textAlign: "left", fontSize: "0.9rem" }}>
            <strong style={{ color: "#f5a623", display: "block", marginBottom: "6px" }}>Default Admin Credentials:</strong>
            <div>Email: <code>admin@steamcafe.com</code></div>
            <div>Password: <code>admin123</code></div>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link
              href="/login?redirect=/admin"
              className="btn btn-primary"
              style={{ padding: "12px 24px", borderRadius: "12px", fontWeight: "bold" }}
            >
              Log in as Admin <i className="fa-solid fa-arrow-right" />
            </Link>
            <Link
              href="/"
              className="btn btn-outline"
              style={{ padding: "12px 24px", borderRadius: "12px" }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0b", color: "#ffffff", padding: "40px 0 80px" }}>
      <div className="container">
        {/* Header Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", letterSpacing: "2px", fontWeight: 700, color: "#f5a623", textTransform: "uppercase" }}>
              <i className="fa-solid fa-shield-halved" /> STEAM CAFE MANAGEMENT
            </span>
            <h1 style={{ fontSize: "2.2rem", margin: "6px 0 4px", fontWeight: 800 }}>Admin Orders Dashboard</h1>
            <p style={{ color: "#a5a5a5", margin: 0, fontSize: "0.95rem" }}>
              Live real-time feed of all incoming cafe orders, kitchen tickets, and deliveries.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#a5a5a5", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: "#f5a623" }}
              />
              Auto-refresh (15s)
            </label>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              style={{
                background: "#1c1c1c",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className={`fa-solid fa-arrows-rotate ${loading ? "fa-spin" : ""}`} />
              Refresh
            </button>
            <span style={{ fontSize: "0.8rem", color: "#777" }}>
              Updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", borderLeft: "4px solid #ef4444", padding: "16px", borderRadius: "8px", color: "#fca5a5", marginBottom: "24px" }}>
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        {/* KPI Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <StatCard title="Total Orders" value={stats.totalOrders} icon="fa-receipt" color="#f5a623" />
          <StatCard title="Pending" value={stats.pending} icon="fa-clock" color="#eab308" subtitle="Needs action" />
          <StatCard title="Preparing" value={stats.preparing} icon="fa-fire-burner" color="#3b82f6" subtitle="In Kitchen" />
          <StatCard title="Ready" value={stats.ready} icon="fa-box" color="#a855f7" subtitle="For delivery/pickup" />
          <StatCard title="Delivered" value={stats.delivered} icon="fa-circle-check" color="#22c55e" subtitle="Completed" />
          <StatCard title="Revenue" value={money(stats.revenue)} icon="fa-wallet" color="#10b981" isMoney />
        </div>

        {/* Filters and Search */}
        <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px", borderRadius: "14px", marginBottom: "28px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
          {/* Search */}
          <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
            <input
              type="text"
              placeholder="Search by customer, phone, city, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                background: "#1c1c1c",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "10px 14px 10px 38px",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "0.9rem"
              }}
            />
          </div>

          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["all", ...statusOptions].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  background: statusFilter === status ? "#f5a623" : "#1c1c1c",
                  color: statusFilter === status ? "#141414" : "#a5a5a5",
                  fontWeight: statusFilter === status ? 700 : 500,
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "0.2s ease"
                }}
              >
                {status === "all" ? `All (${orders.length})` : status}
              </button>
            ))}
          </div>

          {/* Fulfillment Toggle */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "delivery", "pickup"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFulfillmentFilter(type)}
                style={{
                  background: fulfillmentFilter === type ? "rgba(245, 166, 35, 0.2)" : "transparent",
                  color: fulfillmentFilter === type ? "#f5a623" : "#888",
                  border: fulfillmentFilter === type ? "1px solid #f5a623" : "1px solid rgba(255,255,255,0.08)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {type === "all" ? "All Methods" : type}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List / Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#a5a5a5" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#f5a623", marginBottom: "12px" }} />
            <p>Loading live cafe orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#141414", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "2.5rem", color: "#555", marginBottom: "12px" }}>
              <i className="fa-solid fa-inbox" />
            </div>
            <h3 style={{ fontSize: "1.3rem", margin: "0 0 6px" }}>No orders matching current filter</h3>
            <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>
              {orders.length === 0 ? "No orders have been placed in the database yet." : "Try clearing your filters or search keywords."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredOrders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              const isUpdating = updatingId === order._id;

              return (
                <div
                  key={order._id}
                  style={{
                    background: "#141414",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                  }}
                >
                  {/* Top Bar: Order ID, Timestamp, Status & Action Selector */}
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: "#fff", background: "#222", padding: "4px 8px", borderRadius: "6px" }}>
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "#888" }}>
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`
                        }}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Status Changer */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.8rem", color: "#aaa" }}>Update Status:</span>
                      <select
                        value={order.status}
                        disabled={isUpdating}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        style={{
                          background: "#1f1f1f",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "0.85rem",
                          cursor: "pointer"
                        }}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {isUpdating && <i className="fa-solid fa-spinner fa-spin" style={{ color: "#f5a623" }} />}
                    </div>
                  </div>

                  {/* Body Grid: Customer Details, Items, and Pricing */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                    {/* Customer Info */}
                    <div>
                      <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#f5a623", margin: "0 0 8px" }}>
                        Fulfillment: {order.fulfillment?.type === "delivery" ? "🛵 Delivery" : "🏬 Pickup"}
                      </h4>
                      {order.fulfillment?.type === "delivery" ? (
                        <div style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "#ddd" }}>
                          <div><strong>Customer:</strong> {order.fulfillment?.name || "N/A"}</div>
                          <div>
                            <strong>Phone:</strong>{" "}
                            <a href={`tel:${order.fulfillment?.phone}`} style={{ color: "#f5a623", textDecoration: "underline" }}>
                              {order.fulfillment?.phone || "N/A"}
                            </a>
                          </div>
                          <div><strong>Address:</strong> {order.fulfillment?.address || "—"}, {order.fulfillment?.city || "—"}</div>
                          {order.fulfillment?.area && <div><strong>Area:</strong> {order.fulfillment.area}</div>}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "#ddd" }}>
                          <div><strong>Branch:</strong> Steam Cafe ({order.fulfillment?.branch || "Main"} Branch)</div>
                          <div><strong>Method:</strong> Self Pick-up at counter</div>
                        </div>
                      )}

                      {order.notes && (
                        <div style={{ marginTop: "10px", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px", fontSize: "0.85rem", borderLeft: "2px solid #f5a623" }}>
                          <span style={{ color: "#f5a623", fontWeight: 600 }}>Note: </span>
                          <span style={{ color: "#ccc" }}>{order.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div>
                      <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#f5a623", margin: "0 0 8px" }}>
                        Items Ordered ({order.items.reduce((s, it) => s + it.quantity, 0)})
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                            <span>
                              <b style={{ color: "#f5a623" }}>{item.quantity}x</b> {item.name}
                            </span>
                            <span style={{ color: "#aaa" }}>{money(item.lineTotal || item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment & Totals */}
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#888", marginBottom: "4px" }}>
                          <span>Subtotal:</span>
                          <span>{money(order.subtotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#888", marginBottom: "6px" }}>
                          <span>Delivery Fee:</span>
                          <span>{money(order.deliveryFee)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "6px" }}>
                          <span>Total:</span>
                          <span style={{ color: "#f5a623" }}>{money(order.total)}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#888" }}>
                        <span>Payment Method: </span>
                        <strong style={{ color: "#ddd", textTransform: "uppercase" }}>{order.paymentMethod}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {order.status === "Pending" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order._id, "Preparing")}
                        disabled={isUpdating}
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <i className="fa-solid fa-fire-burner" /> Send to Kitchen (Preparing)
                      </button>
                    )}
                    {order.status === "Preparing" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order._id, "Ready")}
                        disabled={isUpdating}
                        style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <i className="fa-solid fa-box" /> Mark as Ready
                      </button>
                    )}
                    {order.status === "Ready" && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order._id, "Delivered")}
                        disabled={isUpdating}
                        style={{ background: "#16a34a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <i className="fa-solid fa-circle-check" /> Complete (Delivered)
                      </button>
                    )}
                    {order.status !== "Cancelled" && order.status !== "Delivered" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this order?")) {
                            updateOrderStatus(order._id, "Cancelled");
                          }
                        }}
                        disabled={isUpdating}
                        style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef4444", padding: "6px 10px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", marginLeft: "auto" }}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  isMoney = false
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  isMoney?: boolean;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: 600 }}>{title}</span>
        <i className={`fa-solid ${icon}`} style={{ color, fontSize: "1.1rem" }} />
      </div>
      <div style={{ marginTop: "10px" }}>
        <span style={{ fontSize: isMoney ? "1.4rem" : "1.8rem", fontWeight: 800, color: "#fff" }}>
          {value}
        </span>
        {subtitle && (
          <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#666" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

