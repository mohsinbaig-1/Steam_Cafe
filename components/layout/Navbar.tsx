"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { itemCount, readCart } from "@/lib/cart";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(itemCount(readCart()));
    update();
    window.addEventListener("storage", update);
    window.addEventListener("steam-cafe-cart-updated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("steam-cafe-cart-updated", update);
    };
  }, []);

  const links = [
    ["/", "Home"], ["/menu", "Menu"], ["/deals", "Deals"], ["/order-history", "Orders"]
  ];

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link href="/" className="logo" onClick={() => setOpen(false)}>
          <Image src="/images/logo/steam-cafe-logo.jpeg" alt="Steam Cafe" width={132} height={58} priority />
        </Link>
        <nav className={`nav-links ${open ? "is-open" : ""}`} aria-label="Main navigation">
          {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/cart" onClick={() => setOpen(false)}><i className="fa-solid fa-cart-shopping" /> Cart <b id="cart-count">{count}</b></Link>
          <Link href="/login" onClick={() => setOpen(false)} className="nav-login"><i className="fa-solid fa-user" /> Login</Link>
        </nav>
        <div className="nav-actions">
          <Link href="/cart" className="cart-button"><i className="fa-solid fa-cart-shopping" /><span>Cart</span><b>{count}</b></Link>
          <Link href="/login" className="login-button">Login</Link>
        </div>
        <button className="mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          <i className="fa-solid fa-bars" />
        </button>
      </div>
    </header>
  );
}
