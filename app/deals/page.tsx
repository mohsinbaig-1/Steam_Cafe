"use client";

import { useCart } from "@/components/cart/CartProvider";
import { getProduct } from "@/lib/products";

export default function DealsPage() {
  const { add } = useCart();
  const dealIds = [1, 5, 11, 14, 14];
  return <main><section className="menu-hero"><div className="container"><p className="section-label">STEAM CAFE DEALS</p><h1>More flavour, <span>better value.</span></h1><p>Enjoy curated bundles made for sharing, available while supplies last.</p></div></section><section className="section"><div className="container"><div className="deal-banner"><div><p className="section-label">FAMILY FAVOURITE</p><h2>Steam Family Deal</h2><p>Steam Zinger Burger, Steam Special Pizza, Loaded Fries and two drinks.</p><strong>Rs. 1,499</strong><br /><button className="btn btn-primary" type="button" onClick={() => dealIds.forEach((id) => { const product = getProduct(id); if (product) add(product); })}>Add Deal to Cart <i className="fa-solid fa-plus" /></button></div><div className="deal-emoji" aria-hidden="true">🍔 🍟 🥤</div></div></div></section></main>;
}
