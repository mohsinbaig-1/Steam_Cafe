"use client";

import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/menu/ProductCard";
import type { ProductCategory } from "@/types";

const filters: Array<[string, string]> = [["all", "All"], ["burgers", "🍔 Burgers"], ["pizza", "🍕 Pizza"], ["chicken", "🍗 Chicken"], ["fries", "🍟 Fries"], ["drinks", "🥤 Drinks"]];

export default function MenuPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("category");
    if (value && filters.some(([categoryName]) => categoryName === value)) setCategory(value);
  }, []);
  const filtered = useMemo(() => products.filter((product) => (category === "all" || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase().trim())), [category, search]);
  return <main><section className="menu-hero"><div className="container"><p className="section-label">STEAM CAFE MENU</p><h1>What are you <span>craving?</span></h1><p>Explore our delicious selection of burgers, pizzas, chicken, fries and drinks.</p></div></section><section className="menu-main"><div className="container"><div className="menu-search"><i className="fa-solid fa-magnifying-glass" /><input aria-label="Search menu" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your favourite food..." /></div><div className="menu-categories">{filters.map(([value, label]) => <button type="button" key={value} className={`category-filter ${category === value ? "active" : ""}`} onClick={() => setCategory(value)}>{label}</button>)}</div><div className="menu-header"><div><p className="section-label">OUR MENU</p><h2>{category === "all" ? "All Items" : filters.find(([value]) => value === category)?.[1].replace(/[^a-zA-Z ]/g, "")}</h2></div><span>{filtered.length} items</span></div><div className="menu-product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>{filtered.length === 0 && <div className="no-results"><div>🍽️</div><h3>No food found</h3><p>Try another search or category.</p></div>}</div></section></main>;
}
