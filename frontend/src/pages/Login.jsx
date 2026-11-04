import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { syncAuthCart } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try { await login(values); await syncAuthCart(); navigate(params.get("next") || "/", { replace: true }); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">WELCOME BACK</span><h1>Log in to NammaCart</h1><p>Sign in when you’re ready to check out or manage your account.</p>{params.get("next")?.includes("checkout") && <div className="info-box">You can browse freely. Sign in is only needed to place your order.</div>}<form onSubmit={submit}><label>Email address<input type="email" required autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label><label>Password<input type="password" required autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label>{error && <p className="error-text">{error}</p>}<button className="button button-primary full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button></form><div className="auth-links"><span>New to NammaCart? <Link to={`/signup${params.get("next") ? `?next=${encodeURIComponent(params.get("next"))}` : ""}`}>Create an account</Link></span><Link to="/seller">Become a seller</Link></div></section></main>;
}
