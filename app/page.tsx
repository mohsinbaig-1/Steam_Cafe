import Link from "next/link";
import { ProductCard } from "@/components/menu/ProductCard";
import { products } from "@/lib/products";

const categories = [["🍔", "Burgers", "8 Items", "burgers"], ["🍕", "Pizza", "6 Items", "pizza"], ["🍗", "Chicken", "7 Items", "chicken"], ["🍟", "Fries", "5 Items", "fries"], ["🥤", "Drinks", "8 Items", "drinks"]];

export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="container hero-container">
        <div className="hero-content">
          <p className="hero-tag"><i className="fa-solid fa-fire" /> FRESH • HOT • DELICIOUS</p>
          <h1>Fresh Food.<span>Big Flavour.</span></h1>
          <p className="hero-description">Delicious burgers, crispy chicken, loaded fries and more — made fresh for you.</p>
          <div className="hero-buttons"><Link href="/menu" className="btn btn-primary">Order Now <i className="fa-solid fa-arrow-right" /></Link><Link href="/menu" className="btn btn-outline">View Menu</Link></div>
          <div className="hero-stats"><div><strong>25+</strong><span>Food Items</span></div><div><strong>4.8</strong><span>Customer Rating</span></div><div><strong>30m</strong><span>Avg. Delivery</span></div></div>
        </div>
        <div className="hero-image"><div className="hero-circle" /><div className="food-placeholder">🍔</div><div className="floating-card card-one"><i className="fa-solid fa-star" /><div><strong>4.8</strong><span>Excellent</span></div></div><div className="floating-card card-two"><i className="fa-solid fa-truck-fast" /><div><strong>Fast</strong><span>Delivery</span></div></div></div>
      </div></section>
      <section className="categories section"><div className="container"><div className="section-heading"><div><p className="section-label">EXPLORE</p><h2>What are you craving?</h2></div><Link href="/menu">View All <i className="fa-solid fa-arrow-right" /></Link></div><div className="category-grid">{categories.map(([icon, name, count, category]) => <Link href={`/menu?category=${category}`} className="category-card" key={category}><div className="category-icon">{icon}</div><h3>{name}</h3><p>{count}</p></Link>)}</div></div></section>
      <section className="products-section section"><div className="container"><div className="section-heading"><div><p className="section-label">CUSTOMER FAVOURITES</p><h2>Popular This Week</h2></div><Link href="/menu">See Menu <i className="fa-solid fa-arrow-right" /></Link></div><div className="product-grid">{products.filter((product) => product.badge === "Popular" || product.badge === "Bestseller").slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>
      <section className="cta-section"><div className="container cta-container"><div><p className="section-label">HUNGRY?</p><h2>Good food is just a click away.</h2><p>Order now and enjoy fresh, delicious food delivered to your doorstep.</p></div><Link href="/menu" className="btn btn-primary">Order Now <i className="fa-solid fa-arrow-right" /></Link></div></section>
    </main>
  );
}
