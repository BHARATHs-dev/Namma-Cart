import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money, request } from "../api.js";

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { request("/sellers/dashboard").then((r) => setData(r.data.dashboard)).catch((e) => setError(e.message)); }, []);
  return <main className="page-content narrow"><span className="eyebrow">SELLER SPACE</span><h1>{data?.shopName || "Shop dashboard"}</h1>{error && <div className="error-box">{error}</div>}{data && <><div className="stats-grid">{[["Products",data.totalProducts],["Orders",data.totalOrders],["Sales",money(data.totalSales)],["Low stock",data.lowStockProducts]].map(([label,value]) => <div className="stat-card" key={label}><span>{label}</span><b>{value}</b></div>)}</div><div className="account-links"><Link to="/seller/products">List or manage products →</Link><Link to="/seller/orders">Seller orders →</Link></div></>}</main>;
}
