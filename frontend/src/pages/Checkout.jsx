import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { money, request } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ fullName: "", phone: "", address: "", city: "", state: "Tamil Nadu", pincode: "" });
  const [coupon, setCoupon] = useState(localStorage.getItem("namma-cart-coupon") || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!user) navigate("/login?next=%2Fcheckout", { replace: true }); else request("/users/profile").then((r) => { const u = r.data.user; setAddress((old) => ({ ...old, fullName: u.fullName || "", phone: u.phone || "", address: u.address || "", city: u.city || "", state: u.state || "Tamil Nadu", pincode: u.pincode || "" })); }).catch(() => {}); }, [user, navigate]);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try { const result = await request("/orders/checkout", { method: "POST", body: JSON.stringify({ shippingAddress: address, paymentMethod: "Cash on Delivery", couponCode: coupon || undefined }) }); localStorage.removeItem("namma-cart-coupon"); await clear(); navigate(`/orders?placed=${result.data.order._id}`); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  if (!items.length) return <main className="page-content empty-state"><h1>Your bag is empty</h1><Link className="button button-primary" to="/products">Browse products</Link></main>;
  return <main className="page-content"><div className="breadcrumbs"><Link to="/cart">← Back to your bag</Link></div><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><span className="eyebrow">ALMOST YOURS</span><h1>Delivery details</h1><p>Your address is only used to deliver this order.</p><div className="form-grid">{[["fullName","Full name"],["phone","Phone number"],["address","Street address"],["city","City"],["state","State"],["pincode","Pincode"]].map(([key,label]) => <label key={key}>{label}<input required value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} /></label>)}</div><label>Coupon code<input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Optional" /></label><p className="summary-hint">Payment method: Cash on Delivery</p>{error && <p className="error-text">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? "Placing order…" : "Place order · " + money(subtotal + (subtotal >= 1000 ? 0 : 50))}</button></form><aside className="order-summary"><h2>Your order</h2>{items.map((item) => <div className="summary-row" key={item._id || item.product._id}><span>{item.product.name} × {item.quantity}</span><span>{money(item.subtotal ?? item.product.price * item.quantity)}</span></div>)}<hr /><div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>{subtotal >= 1000 ? "FREE" : money(50)}</span></div><div className="summary-total"><b>Total</b><strong>{money(subtotal + (subtotal >= 1000 ? 0 : 50))}</strong></div></aside></div></main>;
}
