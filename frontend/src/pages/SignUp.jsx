import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function SignUp() {
  const { signup } = useAuth();
  const { syncAuthCart } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try { await signup(values); await syncAuthCart(); navigate(params.get("next") || "/", { replace: true }); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">JOIN THE MARKETPLACE</span><h1>Create your account</h1><p>Save your addresses, track orders and share product reviews.</p><form onSubmit={submit}><label>Full name<input required maxLength="100" autoComplete="name" value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} /></label><label>Email address<input type="email" required autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label><label>Phone number <small>Optional</small><input type="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} /></label><label>Password<input type="password" required minLength="6" autoComplete="new-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label>{error && <p className="error-text">{error}</p>}<button className="button button-primary full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button></form><div className="auth-links"><span>Already have an account? <Link to={`/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next"))}` : ""}`}>Log in</Link></span><Link to="/seller">Want to sell with us?</Link></div></section></main>;
}
