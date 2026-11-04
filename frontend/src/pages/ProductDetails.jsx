import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { imageOf, money, request } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import QuantityControl from "../components/QuantityControl.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductDetails() {
  const { id } = useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("Description");
  const [error, setError] = useState("");
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    request(`/products/${id}`).then((result) => {
      setProduct(result.data.product);
      return request(`/reviews/product/${id}`);
    }).then((result) => setReviews(result.data || [])).catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (product) request(`/products?category=${encodeURIComponent(product.category)}&sort=rating`)
      .then((result) => setRelated((result.data || []).filter((item) => item._id !== id).slice(0, 4))).catch(() => {});
  }, [product, id]);

  async function submitReview(event) {
    event.preventDefault();
    try {
      await request("/reviews", { method: "POST", body: JSON.stringify({ productId: id, ...review }) });
      const result = await request(`/reviews/product/${id}`);
      setReviews(result.data || []);
      setReview({ rating: 5, comment: "" });
      setNotice("Thank you. Your review has been submitted.");
    } catch (err) {
      if (!user) window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      else setNotice(err.message);
    }
  }

  if (error) return <main className="page-content"><div className="error-box">{error}</div></main>;
  if (!product) return <main className="page-content"><div className="empty-state">Loading product…</div></main>;
  const price = product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price;

  return <main className="page-content">
    <div className="breadcrumbs"><Link to="/">Home</Link> / <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> / {product.name}</div>
    <section className="detail-panel">
      <div className="gallery"><div className="detail-image">{imageOf(product) ? <img src={imageOf(product)} alt={product.name} /> : <span>✿</span>}</div><div className="thumbs">{(product.images?.length ? product.images : [""]).slice(0, 4).map((url, index) => <div className={index === 0 ? "thumb selected" : "thumb"} key={url || index}>{url && <img src={url} alt={`${product.name} ${index + 1}`} />}</div>)}</div></div>
      <div className="detail-info">
        <div className="badges"><span className="category-tag">{product.category}</span><span className="stock-tag">{product.stock == null ? "Available" : product.stock ? `${product.stock} in stock` : "Out of stock"}</span></div>
        <h1>{product.name}</h1>
        <div className="rating">★ {Number(product.averageRating || 0).toFixed(1)} <small>{product.totalReviews || 0} reviews</small> · <span>By {product.seller?.sellerDetails?.shopName || product.seller?.fullName || "Tamil Nadu artisan"}</span></div>
        <div className="detail-price">{money(price)} {price < product.price && <><del>{money(product.price)}</del><span>You save {money(product.price - price)}</span></>}</div>
        <p>{product.description}</p>
        <div className="detail-meta"><span>Made in {product.origin || "Tamil Nadu"}</span>{product.material && <span>Material: {product.material}</span>}{product.artisanName && <span>Artisan: {product.artisanName}</span>}</div>
        <div className="detail-quantity"><span>Quantity</span><QuantityControl value={quantity} max={product.stock || 99} onChange={setQuantity} /></div>
        <div className="detail-actions"><button className="button button-primary" disabled={product.stock === 0} onClick={() => add(product, quantity).then(() => setNotice("Added to your cart.")).catch((err) => setNotice(err.message))}>Add to cart</button><Link className="button button-outline" to="/cart">View cart</Link></div>
        <div className="service-notes"><span><b>Thoughtfully made</b><small>From Tamil Nadu makers</small></span><span><b>Secure checkout</b><small>Pay on delivery available</small></span><span><b>Careful delivery</b><small>Tracked order updates</small></span></div>{notice && <p className="notice">{notice}</p>}
      </div>
    </section>
    <section className="tabs"><div className="tab-buttons">{["Description", "Details", `Reviews (${reviews.length})`].map((name) => <button className={tab === name ? "selected" : ""} key={name} onClick={() => setTab(name)}>{name}</button>)}</div>
      {tab === "Description" ? <p>{product.description}</p> : tab === "Details" ? <p>Category: {product.category} · {product.origin || "Tamil Nadu"}</p> : <div className="reviews"><form className="review-form" onSubmit={submitReview}><h3>Share your experience</h3><select value={review.rating} onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select><textarea required maxLength="1000" placeholder="Write a product review" value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} /><button className="button button-primary">Submit review</button>{notice && <span>{notice}</span>}</form>{reviews.map((item) => <article className="review-row" key={item._id}><b>{item.user?.fullName || "Customer"} · ★ {item.rating}</b><p>{item.comment}</p></article>)}</div>}
    </section>
    {related.length > 0 && <section className="related"><h2>You may also like</h2><div className="product-grid related-grid">{related.map((item) => <ProductCard key={item._id} product={item} add={add} />)}</div></section>}
  </main>;
}
