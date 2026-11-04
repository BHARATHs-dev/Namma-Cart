import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { money, request } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState(0);
  const [filters, setFilters] = useState({ minPrice: "", maxPrice: "", rating: 0 });
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState("");
  const { add } = useCart();
  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || 1);

  useEffect(() => {
    request("/categories").then((result) => setCategories(result.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setError("");
    const query = new URLSearchParams({ page, limit: 8, sort });
    if (category) query.set("category", category);
    if (q) query.set("q", q);
    if (filters.minPrice) query.set("minPrice", filters.minPrice);
    if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);
    if (filters.rating) query.set("minRating", filters.rating);
    request(`/products?${query}`).then((result) => {
      const list = result.data || [];
      setProducts(list);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: list.length });
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [category, q, sort, page, filters, refresh]);

  function applyFilters(event) { event.preventDefault(); setFilters({ minPrice, maxPrice, rating }); setParams((old) => { const next = new URLSearchParams(old); next.delete("page"); return next; }); }
  function clearFilters() { setMinPrice(""); setMaxPrice(""); setRating(0); setFilters({ minPrice: "", maxPrice: "", rating: 0 }); setParams({}); }

  return <main className="page-content">
    <section className="promo"><div><span className="eyebrow">MADE WITH HERITAGE</span><h1>Tradition, made for today.</h1><p>Discover Tamil Nadu’s handloom, crafts and regional favorites. Shop directly from local makers.</p></div><a className="button button-cream" href="#products">Explore products</a></section>
    <div className="shop-layout"><aside className="filters"><div className="filter-title"><h2>Filters</h2><button className="text-button" onClick={clearFilters}>Clear all</button></div><label className="filter-label">CATEGORY</label><button className={!category ? "category-choice active" : "category-choice"} onClick={() => setParams({})}>All products</button>{categories.map((item) => <button key={item.slug} className={category === item.slug ? "category-choice active" : "category-choice"} onClick={() => setParams({ category: item.slug })}>{item.name}</button>)}<hr /><label className="filter-label">PRICE RANGE</label><div className="price-inputs"><input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} /><span>to</span><input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div><label className="filter-label">CUSTOMER RATING</label>{[[4,"4 stars & up"],[3,"3 stars & up"],[0,"Any rating"]].map(([value,label]) => <label className="radio-row" key={label}><input type="radio" name="rating" checked={rating === value} onChange={() => setRating(value)} /> {label}</label>)}<button className="button button-primary full" onClick={applyFilters}>Apply filters</button></aside>
      <section className="catalog" id="products"><div className="catalog-head"><div><h2>{category ? categories.find((item) => item.slug === category)?.name || category : q ? `Results for “${q}”` : "All products"}</h2><p>{pagination.total} products from Tamil Nadu makers</p></div><label className="sort">Sort by <select value={sort} onChange={(e) => setParams((old) => { const next = new URLSearchParams(old); next.set("sort", e.target.value); next.delete("page"); return next; })}><option value="newest">Featured</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option></select></label></div><div className="active-filters">{category && <button onClick={() => setParams({})}>{category.replaceAll("-", " ")} ×</button>}{q && <button onClick={() => setParams({})}>Search: {q} ×</button>}{filters.minPrice && <span>From {money(filters.minPrice)}</span>}{filters.maxPrice && <span>To {money(filters.maxPrice)}</span>}{filters.rating > 0 && <span>{filters.rating} stars & up</span>}</div>
        {notice && <div className="notice">{notice}</div>}{loading ? <div className="empty-state">Loading products…</div> : error ? <div className="error-box">{error}<button className="button button-outline" onClick={() => setRefresh((value) => value + 1)}>Retry</button></div> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} add={async (item) => { try { await add(item); setNotice(`${item.name} added to your bag.`); } catch (err) { setNotice(err.message); } }} />)}</div> : <div className="empty-state">No products found. Try changing your filters.</div>}
        {pagination.totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setParams((old) => { const next = new URLSearchParams(old); next.set("page", page - 1); return next; })}>‹</button><span>{page} / {pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setParams((old) => { const next = new URLSearchParams(old); next.set("page", page + 1); return next; })}>›</button></div>}
      </section></div>
  </main>;
}
