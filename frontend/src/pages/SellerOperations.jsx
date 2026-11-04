import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money, request } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyProduct = { name: "", category: "", price: "", discountPrice: "", stock: "", description: "", material: "", origin: "Tamil Nadu", artisanName: "" };

function ProductForm({ product, categories, onSave, onCancel }) {
  const [values, setValues] = useState(product ? {
    name: product.name, category: product.category, price: product.price,
    discountPrice: product.discountPrice || "", stock: product.stock,
    description: product.description, material: product.material || "",
    origin: product.origin || "Tamil Nadu", artisanName: product.artisanName || "",
  } : emptyProduct);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(product?.images?.[0] || "");

  async function submit(event) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const body = { ...values, price: Number(values.price), discountPrice: Number(values.discountPrice || 0), stock: Number(values.stock) };
      if (file) {
        const upload = new FormData();
        upload.append("images", file);
        const uploaded = await request("/products/images", { method: "POST", body: upload });
        body.image = uploaded.data.images[0];
      }
      else if (!product) throw new Error("Choose a product image to upload.");
      await onSave(body);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <form className="checkout-form seller-product-form" onSubmit={submit}>
    <h2>{product ? "Edit product" : "List a product"}</h2>
    <label>Product name<input required maxLength="200" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></label>
    <label>Category<select required value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })}><option value="">Choose a category</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
    <div className="form-grid"><label>Price (₹)<input required type="number" min="0" step="0.01" value={values.price} onChange={(e) => setValues({ ...values, price: e.target.value })} /></label><label>Offer price (₹)<input type="number" min="0" step="0.01" value={values.discountPrice} onChange={(e) => setValues({ ...values, discountPrice: e.target.value })} /></label></div>
    <label>Available stock<input required type="number" min="0" step="1" value={values.stock} onChange={(e) => setValues({ ...values, stock: e.target.value })} /></label>
    <label>Product description<textarea required maxLength="5000" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></label>
    <label>Product image {product && <small>Leave empty to keep the current image.</small>}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required={!product} onChange={(e) => { const selected = e.target.files?.[0]; if (selected && selected.size > 5 * 1024 * 1024) { setError("Image must be 5 MB or smaller."); setFile(null); setPreview(product?.images?.[0] || ""); e.target.value = ""; return; } setFile(selected || null); setPreview(selected ? URL.createObjectURL(selected) : product?.images?.[0] || ""); }} /></label>
    {preview && <img className="seller-image-preview" src={preview} alt="Product preview" />}
    <div className="form-grid"><label>Material<input maxLength="200" value={values.material} onChange={(e) => setValues({ ...values, material: e.target.value })} /></label><label>Made in<input maxLength="200" value={values.origin} onChange={(e) => setValues({ ...values, origin: e.target.value })} /></label></div>
    <label>Artisan name<input maxLength="100" value={values.artisanName} onChange={(e) => setValues({ ...values, artisanName: e.target.value })} /></label>
    {error && <p className="error-text">{error}</p>}
    <div className="detail-actions"><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : product ? "Save changes" : "Publish product"}</button>{onCancel && <button type="button" className="button button-outline" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}

export function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    request("/sellers/products").then((r) => setProducts(r.data || [])).catch((e) => setError(e.message));
    request("/categories").then((r) => setCategories(r.data.categories || [])).catch((e) => setError(e.message));
  }, [refresh]);

  if (user?.role !== "ADMIN" && user?.role !== "SELLER") return <main className="page-content narrow"><Link to="/seller">← Seller application</Link><section className="seller-welcome"><h1>A seller account is required</h1><p>Open your seller account to list and manage products.</p></section></main>;

  async function create(body) { await request("/sellers/products", { method: "POST", body: JSON.stringify(body) }); setNotice("Your product is now listed in the shop."); setRefresh((value) => value + 1); }
  async function update(body) { await request(`/sellers/products/${editing._id}`, { method: "PUT", body: JSON.stringify(body) }); setEditing(null); setNotice("Product details updated."); setRefresh((value) => value + 1); }

  return <main className="page-content"><Link to="/seller/dashboard">← Dashboard</Link><h1>Your products</h1>{error && <div className="error-box">{error}</div>}{notice && <div className="info-box">{notice}</div>}
    {editing ? <ProductForm key={editing._id} product={editing} categories={categories} onSave={update} onCancel={() => setEditing(null)} /> : <ProductForm key="new-product" categories={categories} onSave={create} />}
    <h2>Products in your shop</h2>{products.length ? products.map((p) => <article className="order-card seller-product-row" key={p._id}>{p.images?.[0] && <img src={p.images[0]} alt="" />}<div><b>{p.name}</b><span>{p.category} · {p.stock} in stock</span><strong>{money(p.discountPrice || p.price)}</strong></div><button className="button button-outline" onClick={() => { setEditing(p); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button></article>) : <p className="empty-state">You have not listed any products yet.</p>}
  </main>;
}

export function SellerOrders() {
  const [orders, setOrders] = useState([]); const [error, setError] = useState("");
  useEffect(() => { request("/sellers/orders").then((r) => setOrders(r.data || [])).catch((e) => setError(e.message)); }, []);
  return <main className="page-content narrow"><Link to="/seller/dashboard">← Dashboard</Link><h1>Orders for your shop</h1>{error && <p className="error-text">{error}</p>}{orders.map((order) => <article className="order-card" key={order._id}><div><b>{order.customer?.fullName}</b><span>{order.orderStatus}</span></div><strong>{money(order.sellerSubtotal)}</strong></article>)}</main>;
}
