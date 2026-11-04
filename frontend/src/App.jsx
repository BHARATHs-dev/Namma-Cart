import { useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import ProductList from "./pages/ProductList.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import SellerSignUp from "./pages/SellerSignUp.jsx";
import Account from "./pages/Account.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import { SellerOrders, SellerProducts } from "./pages/SellerOperations.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="page-content"><div className="empty-state">Loading your account…</div></main>;
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}

function Layout() {
  const [search, setSearch] = useState("");
  return <div className="app-shell"><Header search={search} setSearch={setSearch} /><Routes>
    <Route path="/" element={<ProductList />} />
    <Route path="/products" element={<ProductList />} />
    <Route path="/product/:id" element={<ProductDetails />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/seller" element={<SellerSignUp />} />
    <Route path="/account" element={<Protected><Account /></Protected>} />
    <Route path="/orders" element={<Protected><OrderHistory /></Protected>} />
    <Route path="/orders/:id" element={<Protected><OrderDetail /></Protected>} />
    <Route path="/seller/dashboard" element={<Protected><SellerDashboard /></Protected>} />
    <Route path="/seller/products" element={<Protected><SellerProducts /></Protected>} />
    <Route path="/seller/orders" element={<Protected><SellerOrders /></Protected>} />
    <Route path="*" element={<main className="empty-state"><h1>We couldn’t find that page</h1><Link className="button button-primary" to="/">Back to the market</Link></main>} />
  </Routes><footer className="site-footer"><div className="footer-brand"><span className="brand-mark">N</span><b>NammaCart</b></div><span>Namma Tradition. Namma Pride.</span><span>Celebrating Tamil Nadu’s crafts & culture</span></footer></div>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><Layout /></CartProvider></AuthProvider></BrowserRouter>;
}
