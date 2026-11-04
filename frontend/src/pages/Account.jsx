import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Account() {
  const { user, setUser } = useAuth();
  const [values, setValues] = useState({ fullName: "", phone: "", address: "", city: "", state: "Tamil Nadu", pincode: "" });
  const [message, setMessage] = useState("");
  useEffect(() => { request("/users/profile").then((r) => setValues((v) => ({ ...v, ...r.data.user }))).catch((e) => setMessage(e.message)); }, []);
  async function submit(event) { event.preventDefault(); try { const r = await request("/users/profile", { method: "PUT", body: JSON.stringify(values) }); setUser(r.data.user); setMessage("Your details have been saved."); } catch (e) { setMessage(e.message); } }
  return <main className="page-content narrow"><span className="eyebrow">YOUR ACCOUNT</span><h1>Hello, {user?.fullName}</h1><div className="account-links"><Link to="/orders">Order history →</Link>{user?.role === "SELLER" && <Link to="/seller/dashboard">Seller dashboard →</Link>}</div><form className="checkout-form" onSubmit={submit}><h2>Personal details</h2>{[["fullName","Full name"],["phone","Phone"],["address","Address"],["city","City"],["state","State"],["pincode","Pincode"]].map(([key,label]) => <label key={key}>{label}<input value={values[key] || ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>)}<button className="button button-primary">Save details</button>{message && <p className="notice">{message}</p>}</form></main>;
}
