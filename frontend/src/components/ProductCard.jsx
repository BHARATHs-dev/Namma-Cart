import { Link } from "react-router-dom";
import { imageOf, money } from "../api.js";

export default function ProductCard({ product, add }) {
  const price = product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price;
  return <article className="product-card"><Link to={`/product/${product._id}`} className="product-image">{imageOf(product) ? <img src={imageOf(product)} alt={product.name} /> : <span aria-hidden="true">✿</span>}{product.discountPrice > 0 && <b className="discount">Offer</b>}</Link><div className="product-info"><span className="category-label">{product.category}</span><Link className="product-name" to={`/product/${product._id}`}>{product.name}</Link><span className="rating">★ {Number(product.averageRating || 0).toFixed(1)} <small>({product.totalReviews || 0})</small></span><div className="price">{money(price)} {price < product.price && <del>{money(product.price)}</del>}</div><span className="origin">{product.origin || "Tamil Nadu"}{product.stock != null && product.stock < 10 && product.stock > 0 ? ` · Only ${product.stock} left` : ""}</span><button className="button button-primary card-add" disabled={product.stock === 0} onClick={() => add(product)}>{product.stock === 0 ? "Out of stock" : "Add to cart"}</button></div></article>;
}
