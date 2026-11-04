import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "namma-cart-guest-cart";

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: readGuestCart(), message: "" },
  reducers: {
    setCartItems(state, action) {
      state.items = action.payload;
    },
    addCartItem(state, action) {
      const { product, quantity } = action.payload;
      const existing = state.items.find((item) => item.product._id === product._id);
      if (existing) existing.quantity += quantity;
      else state.items.push({ product, quantity });
    },
    updateCartItem(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find((row) => row.product._id === id);
      if (item) item.quantity = quantity;
    },
    removeCartItem(state, action) {
      state.items = state.items.filter(
        (item) => item.product._id !== action.payload,
      );
    },
    clearCart(state) {
      state.items = [];
    },
    setCartMessage(state, action) {
      state.message = action.payload;
    },
  },
});

export const {
  setCartItems,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  setCartMessage,
} = cartSlice.actions;
export default cartSlice.reducer;
