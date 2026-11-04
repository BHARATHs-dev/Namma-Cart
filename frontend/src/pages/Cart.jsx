import { Link, useNavigate } from "react-router-dom";
import { imageOf, money } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import QuantityControl from "../components/QuantityControl.jsx";
import { request } from "../api.js";
import { useState } from "react";

export default function Cart() {
  const { items, subtotal, update, remove, clear, message, setMessage } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(
    localStorage.getItem("namma-cart-coupon") || "",
  );
  const [couponResult, setCouponResult] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const shipping = subtotal >= 1000 ? 0 : 50;
  const updateItem = (item, quantity) =>
    update(user ? item._id : item.product._id, quantity).catch((error) =>
      setMessage(error.message),
    );
  async function applyCoupon() {
    try {
      const result = await request("/coupons/apply", {
        method: "POST",
        body: JSON.stringify({ code: coupon, orderAmount: subtotal }),
      });
      setCouponResult(result.data);
      setCouponMessage(result.message);
      localStorage.setItem("namma-cart-coupon", coupon.toUpperCase());
    } catch (error) {
      setCouponResult(null);
      setCouponMessage(error.message);
      localStorage.removeItem("namma-cart-coupon");
    }
  }
  return (
    <main className="page-content cart-page">
      <div className="cart-heading">
        <h1>
          Your shopping bag{" "}
          <small>
            ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
          </small>
        </h1>
        <Link to="/products">Continue shopping</Link>
      </div>
      {items.length ? (
        <div className="cart-layout">
          <section className="cart-items">
            <div className="cart-top">
              <span>PRODUCT</span>
              <button className="button button-outline" onClick={() => clear()}>
                Clear bag
              </button>
            </div>
            {items.map((item) => (
              <article className="cart-row" key={item._id || item.product._id}>
                <Link
                  className="cart-thumb"
                  to={`/product/${item.product._id}`}
                >
                  {imageOf(item.product) ? (
                    <img src={imageOf(item.product)} alt={item.product.name} />
                  ) : (
                    <span>âœ¿</span>
                  )}
                </Link>
                <div className="cart-product">
                  <Link to={`/product/${item.product._id}`}>
                    {item.product.name}
                  </Link>
                  <span>{item.product.category}</span>
                  <b>
                    {money(
                      item.price ??
                        (item.product.discountPrice > 0 &&
                        item.product.discountPrice < item.product.price
                          ? item.product.discountPrice
                          : item.product.price),
                    )}
                  </b>
                </div>
                <QuantityControl
                  value={item.quantity}
                  max={item.product.stock || 99}
                  onChange={(quantity) => updateItem(item, quantity)}
                />
                <strong>
                  {money(
                    item.subtotal ??
                      (item.price ?? item.product.price) * item.quantity,
                  )}
                </strong>
                <button
                  className="remove-button"
                  aria-label="Remove item"
                  onClick={() => remove(user ? item._id : item.product._id)}
                >
                  Ã—
                </button>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <label className="coupon-label">Coupon code</label>
            <div className="coupon-input">
              <input
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value.toUpperCase());
                  setCouponResult(null);
                }}
                placeholder="Enter code"
              />
              <button className="button button-outline" onClick={applyCoupon}>
                Apply
              </button>
            </div>
            {couponMessage && (
              <p className={couponResult ? "success-text" : "error-text"}>
                {couponMessage}
              </p>
            )}
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            {couponResult && (
              <div className="summary-row success-text">
                <span>Coupon ({couponResult.code})</span>
                <span>âˆ’{money(couponResult.discountAmount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Delivery</span>
              <span>{shipping ? money(shipping) : "FREE"}</span>
            </div>
            <p className="summary-hint">
              {subtotal < 1000
                ? `Add ${money(1000 - subtotal)} for free delivery.`
                : "Your delivery is on us."}
            </p>
            <hr />
            <div className="summary-total">
              <b>Total</b>
              <strong>
                {money(
                  subtotal - (couponResult?.discountAmount || 0) + shipping,
                )}
              </strong>
            </div>
            {message && <p className="error-text">{message}</p>}
            <button
              className="button button-primary full"
              onClick={() =>
                user
                  ? navigate("/checkout")
                  : navigate("/login?next=%2Fcheckout")
              }
            >
              Proceed to checkout
            </button>
            {!user && (
              <p className="summary-hint">
                Sign in is needed to place an order. Your bag will be waiting.
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="empty-state empty-cart">
          <span className="empty-icon"> <img src="https://t3.ftcdn.net/jpg/05/46/95/22/360_F_546952276_DjgKeYaI2QjUlc1akgAh1JyYFIUCoPIX.jpg" alt="Empty Cart" /> </span>
          <h2>Your bag is waiting for something special</h2>
          <p>
            Explore handmade goods and traditional favorites from Tamil Nadu.
          </p>
          <Link className="button button-primary" to="/products">
            Browse products
          </Link>
        </div>
      )}
    </main>
  );
}
