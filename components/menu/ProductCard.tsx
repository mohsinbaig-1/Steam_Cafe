"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <article className="menu-product-card">
      <div className="menu-product-image">
        {product.badge && <span className="menu-product-badge">{product.badge}</span>}
        <div className="menu-product-emoji">{product.emoji}</div>
      </div>
      <div className="menu-product-info">
        <div className="menu-product-rating"><i className="fa-solid fa-star" /> {product.rating}</div>
        <h3>{product.name}</h3><p>{product.description}</p>
        <div className="menu-product-bottom"><span className="menu-product-price">Rs. {product.price.toLocaleString()}</span>
          <button className="menu-add-button" type="button" onClick={() => add(product)}><i className="fa-solid fa-plus" /> Add</button>
        </div>
      </div>
    </article>
  );
}
