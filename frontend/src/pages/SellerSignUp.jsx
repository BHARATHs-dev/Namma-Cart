import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SellerSignUp() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ shopName: "", shopDescription: "", businessAddress: "" });
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    try {
      const result = await request("/sellers/register", { method: "POST", body: JSON.stringify(values) });
      setUser(result.data.user);
      navigate("/seller/products");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) return <main className="auth-page"><section className="auth-card">
    <span className="eyebrow">SELL WITH NAMMACART</span><h1>Bring your craft to more homes</h1>
    <p>Create or log in to an account, then add your shop details and products.</p>
    <Link className="button button-primary full" to="/login?next=%2Fseller">Log in to continue</Link>
    <div className="auth-links"><Link to="/signup?next=%2Fseller">Create an account</Link></div>
  </section></main>;

  if (user.role === "SELLER" || user.role === "ADMIN") return <main className="page-content">
    <section className="seller-welcome"><span className="eyebrow">YOUR SELLER SPACE</span><h1>Your shop is ready</h1>
      <p>{user.sellerDetails?.shopName || "Thank you for bringing your work to NammaCart."}</p>
      <button className="button button-primary" onClick={() => navigate(user.role === "ADMIN" ? "/seller/dashboard" : "/seller/products")}>
        {user.role === "ADMIN" ? "Open seller dashboard" : "List a product"}
      </button>
    </section>
  </main>;

  return <main className="auth-page"><section className="auth-card">
    <span className="eyebrow">SELL WITH NAMMACART</span><h1>Tell us about your shop</h1>
    <p>Enter your shop details, then add products to the marketplace.</p>
    <form onSubmit={submit}>
      <label>Shop name<input required value={values.shopName} onChange={(event) => setValues({ ...values, shopName: event.target.value })} /></label>
      <label>Business address<input required value={values.businessAddress} onChange={(event) => setValues({ ...values, businessAddress: event.target.value })} /></label>
      <label>About your craft<textarea value={values.shopDescription} onChange={(event) => setValues({ ...values, shopDescription: event.target.value })} /></label>
      <button className="button button-primary full">Continue to product listing</button>
    </form>
    {message && <div className="info-box">{message}</div>}
  </section></main>;
}
