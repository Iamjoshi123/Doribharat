
# Doribharat E-Commerce Documentation

## Architecture Principles
1. **Frontend-First:** Built with React, TypeScript, and Tailwind CSS for a high-performance, responsive UI.
2. **State Management:** Currently utilizes `localStorage` for persistence, designed for an easy migration to a REST/GraphQL API.
3. **Ordering Logic:** Optimized for artisanal sales via a "WhatsApp Direct" checkout, ensuring a personal connection between the maker and the buyer.

---

## 1. Backend API Design (Proposed)

### Base URL: `https://api.doribharat.com/v1`

### A. Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/auth/login` | Returns JWT for Admin access |
| POST | `/auth/refresh` | Refreshes the session token |

### B. Products (`/products`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/products` | List all visible products (Supports `?category=`, `?search=`) |
| GET | `/products/:id` | Fetch detailed single product info |
| POST | `/products` | (Admin) Create a new handcrafted treasure |
| PUT | `/products/:id` | (Admin) Update product details or stock |
| DELETE | `/products/:id` | (Admin) Remove a product from the database |

### C. Categories (`/categories`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/categories` | List all available collections |
| POST | `/categories` | (Admin) Create a new collection (e.g., "Monsoon Edit") |
| PUT | `/categories/:id` | (Admin) Update collection branding |
| DELETE | `/categories/:id` | (Admin) Delete a collection |

### D. Orders & Inquiries (`/orders`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/orders` | Submit a new order (Captures items, user, and initiates WA flow) |
| GET | `/orders` | (Admin) View all order history |
| GET | `/orders/:id` | (Admin) Detailed order view |

---

## 2. Data Schema & Relationships

### Database: PostgreSQL (Recommended for structured heritage data)

#### `products` Table
- `id`: UUID (Primary Key)
- `category_id`: UUID (Foreign Key -> `categories.id`)
- `name`: VARCHAR(255)
- `slug`: VARCHAR(255) (SEO friendly URL)
- `description`: TEXT
- `specifications`: JSONB (Stores structured labels/values)
- `material`: VARCHAR(100)
- `dimensions`: VARCHAR(100)
- `selling_price`: DECIMAL(10, 2)
- `retail_price`: DECIMAL(10, 2)
- `stock_quantity`: INT
- `images`: TEXT[] (Array of Cloudinary/S3 URLs)
- `flags`: JSONB (Contains `is_best_seller`, `is_new`, `on_sale`)
- `created_at`: TIMESTAMP

#### `categories` Table
- `id`: UUID (Primary Key)
- `name`: VARCHAR(100)
- `image_url`: TEXT
- `description`: TEXT

---

## 3. How to Connect Frontend to Backend

### Transitioning from LocalState to API

1. **API Client Setup:**
   Create a `src/services/api.ts` using `axios` or `fetch`.
   ```typescript
   const API_BASE = 'https://api.doribharat.com/v1';
   
   export const getProducts = async () => {
     const res = await fetch(`${API_BASE}/products`);
     return res.json();
   };
   ```

2. **Connecting Components:**
   Replace the `INITIAL_PRODUCTS` logic in `App.tsx` with a `useEffect` hook.
   ```typescript
   useEffect(() => {
     async function loadData() {
       const data = await getProducts();
       setProducts(data);
     }
     loadData();
   }, []);
   ```

3. **Handling Authentication:**
   For Admin tasks, include the JWT in the headers:
   ```typescript
   const updateProduct = async (id, data, token) => {
     await fetch(`${API_BASE}/products/${id}`, {
       method: 'PUT',
       headers: { 
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}` 
       },
       body: JSON.stringify(data)
     });
   };
   ```

4. **Synchronizing Tables:**
   - When a **Product** is created, the backend checks if the `category_id` exists.
   - When a **Category** is deleted, you must decide whether to cascade delete products or set their category to "Uncategorized" (Relational Integrity).

### Cloud Run CORS (Frontend compatibility)
- Set the deployed frontend origin (e.g., `https://doribharat.web.app` or your custom domain) as an environment variable (`FRONTEND_ORIGIN`/`CORS_ALLOWED_ORIGIN`) on the Cloud Run service.
- Return `Access-Control-Allow-Origin: <frontend-origin>` and `Vary: Origin` from the API, and allow headers `Content-Type, Authorization, X-Frontend-Origin` to support authenticated admin calls.
- On Cloud Run, you can inject the origin with:  
  `gcloud run services update doribharat-api --set-env-vars FRONTEND_ORIGIN=https://doribharat.web.app`

## Style Principles
- **Color Palette:** Rooted in Earth tones (#A62C2B, #3D5A2F).
- **Typography:** Modern Sans (Plus Jakarta Sans) for readability, Classic Serif (DM Serif) for heritage feel.
- **Interactions:** Use Tailwind transitions for smooth scale and opacity changes on hover.

## Backend Authentication (Cloud Run ready)
- Express API with `/auth/login` and `/auth/refresh` issuing short-lived JWT access tokens (default 15 minutes) signed with a key pulled from Secret Manager.
- Refresh tokens are opaque, rotation-checked against Postgres (`refresh_tokens` table). Each refresh invalidates the previous token; reuse is rejected.
- Write endpoints are protected by middleware that enforces Bearer JWTs on `POST/PUT/PATCH/DELETE` (auth routes are excluded).
- Admin users are stored in `admin_users`. On startup, the service bootstraps credentials from a Secret Manager entry (JSON array or `{ users: [...] }` with `username` and `password` or `passwordHash`). Passwords are stored hashed with bcrypt.
- Schema is created automatically at runtime; the SQL is also available in `server/sql/schema.sql`.
- Cloud SQL is consumed via `DATABASE_URL` (Postgres). Provide SSL params in the URL if required.

### Environment and Secret configuration (Cloud Run)
- `DATABASE_URL` – Postgres connection string (Cloud SQL via connector or direct).
- `JWT_SIGNING_KEY_SECRET` – Secret Manager name/path for the HMAC signing key used for JWT access tokens.
- `ADMIN_USERS_SECRET` – Secret Manager name/path holding admin bootstrap JSON.
- `ACCESS_TOKEN_TTL_SECONDS` (optional) – overrides access token TTL (default 900).
- `REFRESH_TOKEN_TTL_HOURS` (optional) – refresh token lifetime (default 720 hours / 30 days).
- `GCP_PROJECT` or `GOOGLE_CLOUD_PROJECT` – used to build secret paths when only secret names are provided.
- In Cloud Run, mount `JWT_SIGNING_KEY_SECRET` and `ADMIN_USERS_SECRET` as runtime environment variables pointing to the Secret Manager entries. Grant the service account `Secret Manager Secret Accessor` and Cloud SQL permissions (or Cloud SQL connector) as needed.

### Running locally
1. Populate the required secrets in Secret Manager or export them directly in the environment for local development.
2. Install dependencies and start the API:
   ```bash
   npm install
   npm run server
   ```
3. Login:
   ```bash
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your-password"}'
   ```
4. Refresh:
   ```bash
   curl -X POST http://localhost:8080/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"<token-from-login>"}'
   ```
