import { createContext, useContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { request } from "../api.js";
import { useAuth } from "./AuthContext.jsx";
import {
  addCartItem,
  clearCart,
  removeCartItem,
  setCartItems,
  setCartMessage,
  updateCartItem,
} from "../store/cartSlice.js";

const CartContext = createContext(null);
const STORAGE_KEY = "namma-cart-guest-cart";
const readGuestCart = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { token, loading: authLoading } = useAuth();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const message = useSelector((state) => state.cart.message);
  const syncing = useRef(null);
  const setMessage = (value) => dispatch(setCartMessage(value));

  async function syncAuthCart() {
    if (syncing.current) return syncing.current;
    syncing.current = (async () => {
      try {
        const guestItems = readGuestCart();
        let pendingItems = [...guestItems];
        const existingCart = await request("/cart");
        const serverItems = existingCart.data.items || [];
        for (const item of guestItems) {
          const existing = serverItems.find((row) => row.product._id === item.product._id);
          const quantity = (existing?.quantity || 0) + item.quantity;
          try {
            if (existing) await request(`/cart/update/${existing._id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
            else await request("/cart/add", { method: "POST", body: JSON.stringify({ productId: item.product._id, quantity }) });
          } catch {
            const productResult = await request(`/products/${item.product._id}`);
            const stock = productResult.data.product.stock;
            const adjusted = Math.min(quantity, stock);
            if (existing && adjusted > 0) await request(`/cart/update/${existing._id}`, { method: "PUT", body: JSON.stringify({ quantity: adjusted }) });
            else if (existing) await request(`/cart/remove/${existing._id}`, { method: "DELETE" });
            else if (adjusted > 0) await request("/cart/add", { method: "POST", body: JSON.stringify({ productId: item.product._id, quantity: adjusted }) });
            setMessage("Your bag was merged. Some quantities were adjusted to current stock.");
          }
          pendingItems = pendingItems.filter((row) => row.product._id !== item.product._id);
          if (pendingItems.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingItems));
          else localStorage.removeItem(STORAGE_KEY);
        }
        const result = await request("/cart");
        dispatch(setCartItems(result.data.items || []));
      } catch (error) { setMessage(error.message); throw error; }
    })();
    try { await syncing.current; } finally { syncing.current = null; }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!token) { dispatch(setCartItems(readGuestCart())); return; }
    syncAuthCart().catch(() => {});
  }, [token, authLoading]);

  function storeGuest(next, action) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    dispatch(action);
  }

  async function refresh() {
    if (token) {
      const result = await request("/cart");
      dispatch(setCartItems(result.data.items || []));
    }
  }

  async function add(product, quantity = 1) {
    setMessage("");
    if (token) {
      await request("/cart/add", { method: "POST", body: JSON.stringify({ productId: product._id, quantity }) });
      await refresh();
      return;
    }
    const current = readGuestCart();
    const found = current.find((item) => item.product._id === product._id);
    const nextQuantity = (found?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) throw new Error(`Only ${product.stock} available.`);
    storeGuest(
      found
        ? current.map((item) =>
            item.product._id === product._id
              ? { ...item, quantity: nextQuantity }
              : item,
          )
        : [...current, { product, quantity }],
      addCartItem({ product, quantity }),
    );
  }

  async function update(id, quantity) {
    if (quantity < 1) return remove(id);
    if (token) {
      await request(`/cart/update/${id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
      await refresh();
      return;
    }
    const current = readGuestCart();
    const row = current.find((item) => item.product._id === id);
    if (row && quantity > row.product.stock) throw new Error(`Only ${row.product.stock} available.`);
    storeGuest(
      current.map((item) => (item.product._id === id ? { ...item, quantity } : item)),
      updateCartItem({ id, quantity }),
    );
  }

  async function remove(id) {
    if (token) {
      await request(`/cart/remove/${id}`, { method: "DELETE" });
      await refresh();
      return;
    }
    storeGuest(
      readGuestCart().filter((item) => item.product._id !== id),
      removeCartItem(id),
    );
  }

  async function clear() {
    if (token) await request("/cart/clear", { method: "DELETE" });
    localStorage.removeItem(STORAGE_KEY);
    dispatch(clearCart());
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal ?? (item.product.discountPrice > 0 && item.product.discountPrice < item.product.price ? item.product.discountPrice : item.product.price) * item.quantity), 0);

  return <CartContext.Provider value={{ items, count, subtotal, message, setMessage, add, update, remove, clear, refresh, syncAuthCart }}>{children}</CartContext.Provider>;
}
