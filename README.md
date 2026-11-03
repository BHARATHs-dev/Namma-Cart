# NammaCart – Traditional Products E-Commerce Platform

NammaCart is a dedicated e-commerce platform focused on selling traditional Indian products, initially targeting authentic Tamil Nadu heritage crafts, handlooms, GI-tagged textiles, temple art, and organic regional delicacies.

---

## 1. Project Overview

NammaCart supports three distinct user roles:
1. **Customer:** Browse catalog, filter by traditional category, manage shopping cart, apply coupons, and checkout with historical price snapshots and live tracking.
2. **Seller:** Register shop, await administrator approval, manage products, view seller-specific orders, and review store sales analytics.
3. **Admin:** Manage platform catalog, categories, user applications, and global order fulfillment.

---

## 2. Project Architecture

The backend strictly adheres to the standard **MVC + Service Layer** pattern using **Node.js, Express.js, MongoDB and Mongoose**:

```text
namma-cart/
│
├── frontend/
│   └── (React frontend)
│
├── backend/
│   ├── package.json
│   ├── .env
│   │
│   └── src/
│       ├── server.js
│       ├── app.js
│       │
│       ├── config/
│       │   └── database.js
│       │
│       ├── models/
│       │   ├── User.js
│       │   ├── Product.js
│       │   ├── Cart.js
│       │   ├── Order.js
│       │   ├── Review.js
│       │   └── Activity.js
│       │
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── userRoutes.js
│       │   ├── productRoutes.js
│       │   ├── cartRoutes.js
│       │   ├── orderRoutes.js
│       │   ├── reviewRoutes.js
│       │   └── sellerRoutes.js
│       │
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── productController.js
│       │   ├── cartController.js
│       │   ├── orderController.js
│       │   ├── reviewController.js
│       │   └── sellerController.js
│       │
│       ├── services/
│       │   ├── authService.js
│       │   ├── productService.js
│       │   ├── cartService.js
│       │   ├── orderService.js
│       │   └── activityService.js
│       │
│       └── middleware/
│           ├── authentication.js
│           ├── authorization.js
│           └── validation.js
│
└── README.md
```

---

## 3. Technology Stack

- **Node.js & Express.js (v5)**: High-performance CommonJS REST API.
- **MongoDB & Mongoose (v8)**: ODM with indexing, timestamps, and schema validation.
- **Authentication**: JWT (`jsonwebtoken`) with `Bearer` header token validation.
- **Password Hashing**: `bcryptjs` (Salt factor 10).
- **Validation**: `express-validator` with centralized response formatting.
- **Security**: `helmet`, `cors`, `express-rate-limit`.
- **Logging**: `morgan`.

---

## 4. Environment Configuration

The backend reads configuration from `backend/.env`:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/nammaCart

JWT_SECRET=replace_with_a_secure_secret_key
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

CURRENCY=INR
SHIPPING_FREE_THRESHOLD=1000
SHIPPING_CHARGE=50
```

---

## 5. Getting Started

### Prerequisites
- Node.js (>= 18.11)
- MongoDB instance running locally on `127.0.0.1:27017` or configured via MongoDB Atlas URI.

### Running the Server
```bash
cd backend
npm install
npm run dev     # Starts development server with auto-reload on port 5000
npm start       # Starts production server
```

---

## 6. Development Credentials (Testing Only)

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@nammacart.com` | `AdminPassword123!` | Platform management & seller approvals |
| **Seller 1** | `seller@nammacart.com` | `SellerPassword123!` | *Tamil Nadu Heritage Crafts* (Kumbakonam) |
| **Seller 2** | `meenakshi@nammacart.com` | `SellerPassword123!` | *Kanchi Loom Weaves* (Kanchipuram) |
| **Customer** | `customer@nammacart.com` | `CustomerPassword123!` | Regular buyer account (Chennai) |

---

## 7. Supported Traditional Categories

Stored as validated categories directly within `Product.js` and `productService.js`:

1. **Traditional Clothing** (Kanchipuram Silks, Madurai Sungudi, Chettinad Cotton, Salem Veshtis)
2. **Handicrafts** (Swamimalai lost-wax bronze sculptures, Madurai wood carvings)
3. **Traditional Jewellery** (Vadasery Temple Jewellery, Kemp stone necklaces)
4. **Traditional Food** (Kumbakonam degree coffee powder, Uthukuli cow ghee, palm jaggery)
5. **Home Decor** (Tanjore 22K gold foil paintings, Athangudi handmade floor tiles)
6. **Pottery and Terracotta** (Manamadurai Vaigai river clay water pots)
7. **Pooja Items** (Nachiarkoil brass Kuthu Vilakkus, embossed brass thalis)
8. **Eco-Friendly Products** (Chettinad palm leaf Kottan baskets, coconut shell cups)

---

## 8. Built-in Coupons & Discounts

Calculated entirely on the backend in `orderService.js`:

- **SAVE10**: 10% discount on orders of ₹500 or more (Max discount ₹1,000).
- **NAMMA20**: 20% discount on orders of ₹2,000 or more (Max discount ₹1,500).

Persistent coupon usage is recorded in `Order.CouponUsage` to ensure strict limits.

---

## 9. Complete API Reference

### Health Check
- `GET /api/health` — Returns server uptime and MongoDB connection state.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Customer account registration with JWT issuance.
- `POST /api/auth/login` — Account login; returns user info and JWT (rate-limited).
- `GET /api/auth/me` — Authenticated current user profile.
- `POST /api/auth/logout` — Logout confirmation.
- `POST /api/auth/forgot-password` — Password reset token generation.
- `POST /api/auth/reset-password` — Password update using reset token.

### User Management (`/api/users`)
- `GET /api/users/profile` — Fetch profile details.
- `PUT /api/users/profile` — Update name, phone, city, address, pincode.
- `PUT /api/users/change-password` — Verify current password and update.
- `GET /api/users/orders` — User's order history.
- `GET /api/users/activities` — Chronological user activity logs.

### Products & Categories (`/api/products` & `/api/categories`)
- `GET /api/categories` & `GET /api/products/categories` — List all traditional categories.
- `GET /api/categories/:slug` — Category metadata by slug.
- `GET /api/products` — Filtered catalog (`page`, `limit`, `category`, `minPrice`, `maxPrice`, `origin`, `isHandmade`, `isFeatured`, `sort`).
- `GET /api/products/featured` — Featured products.
- `GET /api/products/search?q=keyword` — Text search across title, description, material, origin.
- `GET /api/products/category/:slug` — Products for a specific category slug.
- `GET /api/products/:id` — Single product details.
- `POST /api/products` — Create product (Approved Seller / Admin).
- `PUT /api/products/:id` — Update product (Owner / Admin).
- `DELETE /api/products/:id` — Soft-delete product (`isActive = false`).

### Shopping Cart (`/api/cart`)
- `GET /api/cart` — User cart with live prices and computed subtotals.
- `POST /api/cart/add` — Add product; validates stock and increments quantity.
- `PUT /api/cart/update/:itemId` — Update line-item quantity with stock check.
- `DELETE /api/cart/remove/:itemId` — Remove item from cart.
- `DELETE /api/cart/clear` — Clear all items.

### Coupons (`/api/coupons` & `/api/orders/coupons`)
- `POST /api/coupons/apply` — Apply and calculate discount on backend (`code`, `orderAmount`).
- `GET /api/coupons` — Browse active system coupons.

### Orders & Checkout (`/api/orders`)
- `POST /api/orders/checkout` — Checkout workflow: validates stock, applies coupon, calculates shipping, freezes price snapshots, deducts inventory, and clears cart.
- `GET /api/orders` — Orders list (Customer sees own; Admin sees all).
- `GET /api/orders/:id` — Order details (Owner / Admin).
- `GET /api/orders/:id/tracking` — Tracking timeline and delivery estimate.
- `PUT /api/orders/:id/cancel` — Cancel order and restore product stock.

### Reviews (`/api/reviews`)
- `POST /api/reviews` — Add review (1 review per product per customer, 1–5 rating).
- `GET /api/reviews/product/:productId` — Public reviews for a product.
- `PUT /api/reviews/:id` — Edit review (recomputes product average rating).
- `DELETE /api/reviews/:id` — Delete review (recomputes product average rating).

### Seller Portal (`/api/sellers`)
- `POST /api/sellers/register` — Submit seller application (`shopName`, `businessAddress`).
- `GET /api/sellers/admin/applications` — (Admin) List pending seller applications.
- `PUT /api/sellers/admin/:sellerId/status` — (Admin) Approve or reject seller.
- `GET /api/sellers/dashboard` — Overview of products, orders, and sales revenue.
- `GET /api/sellers/products` — Filtered catalog of seller's products.
- `GET /api/sellers/orders` — Orders filtered for seller's items.
- `GET /api/sellers/analytics` — Revenue statistics, top products, and low stock alerts.
- `PUT /api/sellers/products/:id` — Seller product update.
- `DELETE /api/sellers/products/:id` — Seller product soft deletion.

---

## 10. Security & Stateless JWT Logout Explanation

- **Password Security**: Passwords hashed with `bcryptjs` (salt factor 10); omitted from all API responses (`select: false` and `.toSafeObject()`).
- **Authorization**: Role-based access control (`CUSTOMER`, `SELLER`, `ADMIN`) and seller approval status validation.
- **Input Sanitization**: Validated through `express-validator`.
- **Stateless JWT Logout**: JWT tokens are stateless and self-contained; the server does not hold active session state in a database. When a client invokes `/api/auth/logout`, the server confirms the request, and the client must discard the token from local storage or cookies.
