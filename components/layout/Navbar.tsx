"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { itemCount, readCart } from "@/lib/cart";

interface UserProfile {
  fullName?: string;
  email?: string;
  role?: "customer" | "staff" | "admin";
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const update = () => setCount(itemCount(readCart()));
    const checkAuth = () => {
      if (typeof window === "undefined") return;
      const token = window.sessionStorage.getItem("steamCafeAuthToken");
      const stored = window.sessionStorage.getItem("steamCafeUser");
      if (token && stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    update();
    checkAuth();

    window.addEventListener("storage", update);
    window.addEventListener("steam-cafe-cart-updated", update);
    window.addEventListener("steam-cafe-auth-updated", checkAuth);

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("steam-cafe-cart-updated", update);
      window.removeEventListener("steam-cafe-auth-updated", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("steamCafeAuthToken");
      window.sessionStorage.removeItem("steamCafeUser");
      window.dispatchEvent(new Event("steam-cafe-auth-updated"));
      setUser(null);
      window.location.href = "/";
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const links: Array<[string, string]> = [
    ["/", "Home"],
    ["/menu", "Menu"],
    ["/deals", "Deals"],
    ["/order-history", "Orders"],
    ...(isAdmin ? [["/admin", "Admin Dashboard ⚡"] as [string, string]] : [])
  ];

  const displayName = user?.fullName ? user.fullName.split(" ")[0] : "Account";

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link href="/" className="logo" onClick={() => setOpen(false)}>
          <Image src="/images/logo/steam-cafe-logo.jpeg" alt="Steam Cafe" width={132} height={58} priority />
        </Link>
        <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={href === "/admin" ? { color: "#f5a623", fontWeight: 700 } : undefined}
            >
              {label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setOpen(false)}>
            <i className="fa-solid fa-cart-shopping" /> Cart <b id="cart-count">{count}</b>
          </Link>
          {user ? (
            <div className="nav-login" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>
                <i className="fa-solid fa-user" /> {displayName} {isAdmin && <small style={{ color: "#f5a623" }}>(Admin)</small>}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  marginLeft: "6px"
                }}
              >
                (Logout)
              </button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="nav-login">
              <i className="fa-solid fa-user" /> Login
            </Link>
          )}
        </nav>
        <div className="nav-actions">
          {isAdmin && (
            <Link
              href="/admin"
              className="login-button"
              style={{
                background: "linear-gradient(135deg, #f5a623, #d98d0d)",
                color: "#141414",
                fontWeight: 700,
                border: "none",
                padding: "8px 16px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-gauge" /> Admin
            </Link>
          )}
          <Link href="/cart" className="cart-button">
            <i className="fa-solid fa-cart-shopping" />
            <span>Cart</span>
            <b>{count}</b>
          </Link>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                Hi, {displayName} {isAdmin && <span style={{ color: "#f5a623", fontSize: "0.8rem" }}>[Admin]</span>}
              </span>
              <button
                type="button"
                className="login-button"
                onClick={handleLogout}
                style={{ padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="login-button">
              Login
            </Link>
          )}
        </div>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <i className="fa-solid fa-bars" />
        </button>
      </div>
    </header>
  );
}
