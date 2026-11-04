import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ search, setSearch }) {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <header className="site-header"><Link to="/" className="brand"><span className="brand-mark">N</span><span>NammaCart<small>நம்ம பாரம்பரியம்</small></span></Link><form className="search" onSubmit={(event) => { event.preventDefault(); navigate(`/products?q=${encodeURIComponent(search || "")}`); }}><input aria-label="Search products" placeholder="Search for products, crafts and more" value={search} onChange={(event) => setSearch(event.target.value)} /><button aria-label="Search">⌕</button></form><nav className="header-nav"><Link to="/products">Shop</Link><Link to="/seller">Sell with us</Link>{user ? <><Link to="/account">{user.fullName?.split(" ")[0]}</Link><button className="text-button" onClick={async () => { await logout(); navigate("/"); }}>Sign out</button></> : <><Link to="/login">Login</Link><Link className="signup-link" to="/signup">Sign up</Link></>}<Link className="cart-link" to="/cart">Bag <span className="cart-count">{count}</span></Link></nav></header>;
}
