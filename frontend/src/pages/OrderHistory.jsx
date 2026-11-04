import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { money, request } from "../api.js";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  useEffect(() => { request("/users/orders").then((r) => setOrders(r.data.orders || [])).catch((e) => setError(e.message)); }, []);
  return <main className="page-content narrow"><span className="eyebrow">YOUR ACCOUNT</span><h1>Order history</h1>{params.get("placed") && <div className="info-box">Your order is placed. Thank you for supporting local makers!</div>}{error && <p className="error-text">{error}</p>}{orders.length ? orders.map((order) => <article className="order-card" key={order._id}><div><b>Order {order._id.slice(-8).toUpperCase()}</b><span>{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.orderStatus}</span></div><strong>{money(order.finalAmount)}</strong><Link to={`/orders/${order._id}`}>View order</Link></article>) : !error && <div className="empty-state">No orders yet. <Link to="/products">Explore the marketplace</Link></div>}</main>;
}
