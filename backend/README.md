# NammaCart product API

This Express API stores products in MongoDB and returns a Fake Store API–style product shape. The existing Mongoose product model remains the database schema; the controller maps its fields to the public API format.

## Requirements and setup

- Node.js 18.11 or later
- MongoDB local or Atlas connection string

From `backend`, install dependencies and prepare environment settings:

```powershell
npm install
Copy-Item .env.example .env
```

Set `MONGODB_URI`, a long random `JWT_SECRET`, and `CLIENT_URL` in `.env`. Never commit `.env`; it is ignored by Git. Start MongoDB if using a local database, then start the API:

```powershell
npm start
```

The API listens on port 5000 by default. `GET /api/health` reports server and database status.

## Product response

Product endpoints return this shape, with MongoDB’s `_id` exposed as `id`. Internal fields such as `_id` and `__v` are not returned.

```json
{
  "id": "672a1234567890abcdef1234",
  "title": "Premium Blue T-Shirt",
  "price": 799,
  "description": "Premium cotton T-shirt",
  "category": "men's clothing",
  "image": "https://example.com/tshirt.jpg",
  "rating": { "rate": 4.5, "count": 25 }
}
```

## Product endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/products` | Public | List all active products; with `page` and `limit`, returns one page as an array |
| GET | `/api/products/:id` | Public | Get one product; invalid IDs return 400, missing products return 404 |
| GET | `/api/products/categories` | Public | List unique categories used by active products |
| GET | `/api/products/category/:category` | Public | List active products in a category (URL-encode spaces) |
| GET | `/api/products/search?q=term` | Public | Search active products |
| POST | `/api/products` | Admin token | Create a product |
| PUT | `/api/products/:id` | Admin token | Partially update a product |
| DELETE | `/api/products/:id` | Admin token | Deactivate a product so it no longer appears in public listings |

`PUT` preserves every field omitted from the request. Only `title`, `price`, `description`, `category`, `image`, and `rating.rate` / `rating.count` are accepted. IDs, MongoDB fields, and unexpected fields are rejected. Price must be non-negative, rating rate must be from 0 to 5, and rating count must be a non-negative whole number. A created product is assigned to the signed-in admin and starts with 20 units in stock in the marketplace model.

Product list endpoints accept `page` and `limit` query values. Responses remain JSON arrays and include `X-Total-Count` and `X-Total-Pages` headers for pagination. For example, `/api/products?page=1&limit=8` returns the first eight products. The API exposes these headers to the configured frontend origin.

## Admin access

The existing login endpoint issues a signed JWT. Product creation, updates, and deletes require a user whose role is `ADMIN`; the backend checks that role on every write request.

To create the first admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters in `.env`, then run:

```powershell
npm run create:admin
```

The `User` model hashes the password with bcrypt. The script won’t replace an existing account or promote a non-admin account. Log in using Postman at `POST /api/auth/login` with the admin email and password, then use the returned token as a Bearer token for product write requests.

## Postman examples

### List products

`GET http://localhost:5000/api/products`

### Create a product

`POST http://localhost:5000/api/products` with Authorization type **Bearer Token** and JSON body:

```json
{
  "title": "Premium Blue T-Shirt",
  "price": 799,
  "description": "Premium cotton T-shirt",
  "category": "men's clothing",
  "image": "https://example.com/tshirt.jpg",
  "rating": { "rate": 4.5, "count": 25 }
}
```

### Retrieve, update, and delete

Use the returned `id` in these paths:

- `GET http://localhost:5000/api/products/PRODUCT_ID`
- `PUT http://localhost:5000/api/products/PRODUCT_ID` with a partial body, e.g. `{ "price": 849, "rating": { "rate": 4.6 } }`
- `DELETE http://localhost:5000/api/products/PRODUCT_ID` (admin Bearer token required)

For categories, call `GET http://localhost:5000/api/products/categories`, then `GET http://localhost:5000/api/products/category/Traditional%20Food`.

## React integration

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to the API base URL. Restart Vite after changing the environment file.

```js
const apiUrl = import.meta.env.VITE_API_URL;

async function loadProducts() {
  const response = await fetch(`${apiUrl}/products`);
  if (!response.ok) throw new Error("Could not load products");
  return response.json();
}
```

The React product card can render `id`, `title`, `price`, `description`, `category`, `image`, and `rating.rate` / `rating.count` directly.

## Sample data and troubleshooting

`npm run seed:products` adds or updates 6 development sample products in each of the 8 categories for the sample seller. Their image URLs are blank in the seed file; add URLs at the marked `image` field. It does not overwrite products owned by other sellers. Add and maintain the real catalog through the API instead.

- **Cannot connect to MongoDB:** check `MONGODB_URI`, network access rules for Atlas, and local MongoDB status.
- **401 on a write request:** log in and set the returned JWT as a Bearer token.
- **403 on a write request:** the signed-in account must have the `ADMIN` role.
- **400 response:** check required fields, accepted keys, the image URL, price, and rating values.
- **404 response:** check the product ID or confirm the product is active.
- **No products:** the collection may be empty or all stored products may be inactive.

No production-readiness claim is made. Review the deployment configuration and security settings before using this API with real customers.
