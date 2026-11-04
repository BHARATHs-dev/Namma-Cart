import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { money, request } from "../api.js";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { request(`/orders/${id}`).then((r) => setOrder(r.data.order)).catch((e) => setError(e.message)); }, [id]);
  if (error) return <main className="page-content narrow"><div className="error-box">{error}</div></main>;
  if (!order) return <main className="page-content narrow"><div className="empty-state">Loading order…</div></main>;
  return <main className="page-content narrow"><Link to="/orders">← Order history</Link><h1>Order {order._id.slice(-8).toUpperCase()}</h1><div className="info-box">Status: {order.orderStatus}</div>{order.items.map((item) => <div className="summary-row order-item" key={item._id}><span>{item.productName} × {item.quantity}</span><b>{money(item.subtotal)}</b></div>)}<hr /><div className="summary-total"><b>Total paid</b><strong>{money(order.finalAmount)}</strong></div><h2>Delivery address</h2><p>{order.shippingAddress.fullName}<br />{order.shippingAddress.address}, {order.shippingAddress.city}<br />{order.shippingAddress.state} {order.shippingAddress.pincode}</p></main>;
}
