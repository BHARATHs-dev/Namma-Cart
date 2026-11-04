const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("namma-cart-token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok || result.success === false) {
    const details = Array.isArray(result.errors)
      ? result.errors.map((error) => error.field ? `${error.field}: ${error.message}` : error.message).filter(Boolean)
      : [];
    throw new Error(details.length ? `${result.message || "Please try again."} — ${details.join("; ")}` : result.message || "Please try again.");
  }

  if (path === "/categories" && Array.isArray(result)) {
    return { success: true, data: { categories: result.map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })) } };
  }

  if (path.startsWith("/products/categories")) {
    return Array.isArray(result) ? { success: true, data: { categories: result } } : { success: true, data: result };
  }

  if (path.startsWith("/products")) {
    const fromApi = (product) => ({
      _id: product.id,
      name: product.title,
      price: product.price,
      discountPrice: product.discountPrice || 0,
      stock: product.stock,
      description: product.description,
      category: product.category,
      images: product.image ? [product.image] : [],
      material: product.material || "",
      origin: product.origin || "Tamil Nadu",
      artisanName: product.artisanName || "",
      seller: product.seller || null,
      averageRating: product.rating?.rate || 0,
      totalReviews: product.rating?.count || 0,
    });
    if (Array.isArray(result)) {
      const query = new URLSearchParams(path.split("?")[1] || "");
      const page = Number(query.get("page") || 1);
      const limit = Number(query.get("limit") || result.length || 1);
      const total = Number(response.headers.get("X-Total-Count") || result.length);
      const totalPages = Number(response.headers.get("X-Total-Pages") || Math.ceil(total / limit));
      return { success: true, data: result.map(fromApi), pagination: { page, limit, total, totalPages } };
    }
    if (result?.id && result?.title) return { success: true, data: { product: fromApi(result) } };
    if (result?.message) return { success: true, data: result };
  }

  return result;
}

export function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function imageOf(product) {
  return product?.images?.[0] || "";
}
