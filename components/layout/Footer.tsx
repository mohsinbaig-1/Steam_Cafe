import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="logo footer-logo"><Image src="/images/logo/steam-cafe-logo.jpeg" alt="Steam Cafe Logo" width={132} height={58} /></Link>
          <p>Fresh food. Big flavour.<br />Made with passion at Steam Cafe.</p>
        </div>
        <div>
          <h3>Quick Links</h3>
          <Link href="/">Home</Link><Link href="/menu">Menu</Link><Link href="/deals">Deals</Link><Link href="/order-history">Orders</Link>
        </div>
        <div>
          <h3>Contact</h3>
          <p><i className="fa-solid fa-phone" /> +92 300 0000000</p>
          <p><i className="fa-solid fa-envelope" /> info@steamcafe.com</p>
        </div>
        <div>
          <h3>Opening Hours</h3>
          <p>Monday – Thursday</p><strong>11:00 AM – 11:00 PM</strong>
          <p>Friday – Sunday</p><strong>11:00 AM – 12:00 AM</strong>
        </div>
      </div>
      <div className="footer-bottom"><p>© 2026 Steam Cafe. All Rights Reserved.</p></div>
    </footer>
  );
}
