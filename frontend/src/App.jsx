import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

const pages = [
  ["products", "Shop"],
  ["cart", "Your cart"],
  ["checkout", "Checkout"],
  ["login", "Log in"],
  ["signup", "Create account"],
  ["seller", "Sell with us"],
  ["account", "My account"],
  ["orders", "Order history"],
  ["seller/dashboard", "Seller dashboard"],
];

function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">GOOD FOOD, GOOD NEIGHBOURS</span>
          <h1>Your neighborhood market, delivered.</h1>
          <p>
            Find fresh produce and everyday favorites from the local sellers
            who make our community special.
          </p>
          <Link className="button button-dark" to="/products">
            Explore the market <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="hero-art" role="img" aria-label="Fresh local produce">
          <span className="produce produce-one" aria-hidden="true">🥑</span>
          <span className="produce produce-two" aria-hidden="true">🍊</span>
          <span className="produce produce-three" aria-hidden="true">🥬</span>
          <span className="produce produce-four" aria-hidden="true">🍋</span>
          <span className="art-note">Picked nearby<br />with care</span>
        </div>
      </section>
      <section className="welcome">
        <span className="eyebrow">A LITTLE CLOSER TO HOME</span>
        <h2>Local finds. Everyday good.</h2>
        <p>Discover the people and products that make your neighborhood unique.</p>
      </section>
    </main>
  );
}

function PagePlaceholder({ title }) {
  return (
    <main className="page-placeholder">
      <span className="eyebrow">NAMMA CART</span>
      <h1>{title}</h1>
      <p>This page is ready for its next feature.</p>
      <Link className="text-link" to="/">Back to home <span aria-hidden="true">→</span></Link>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="site-header">
          <Link className="brand" to="/" aria-label="Namma Cart home">
            <span className="brand-mark" aria-hidden="true">n</span>
            namma<span className="brand-light">cart</span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link to="/products">Shop</Link>
            <Link to="/seller">Sell with us</Link>
          </nav>
          <div className="header-actions">
            <Link className="login-link" to="/login">Log in</Link>
            <Link className="cart-link" to="/cart">
              Cart <span className="cart-count">0</span>
            </Link>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          {pages.map(([path, title]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={<PagePlaceholder title={title} />}
            />
          ))}
          <Route path="*" element={<PagePlaceholder title="Page not found" />} />
        </Routes>
        <footer className="site-footer">
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark" aria-hidden="true">n</span>
            namma<span className="brand-light">cart</span>
          </Link>
          <span>Good things grow close to home.</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;