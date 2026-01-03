
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

## Style Principles
- **Color Palette:** Rooted in Earth tones (#A62C2B, #3D5A2F).
- **Typography:** Modern Sans (Plus Jakarta Sans) for readability, Classic Serif (DM Serif) for heritage feel.
- **Interactions:** Use Tailwind transitions for smooth scale and opacity changes on hover.

---

## Media Uploads with Google Cloud Storage

The admin experience now signs short-lived upload URLs so product images are persisted as public GCS URLs inside `products.images`.

### 1) Provision the bucket
Ensure you are authenticated with `gcloud` for the correct project, then run:

```bash
# Create the bucket with uniform bucket-level access
gcloud storage buckets create gs://doribharat-product-media --location=asia-south1 --uniform-bucket-level-access

# Apply lifecycle rules (auto-delete temp uploads) and CORS for the admin origin
gcloud storage buckets update gs://doribharat-product-media \
  --lifecycle-file=infra/gcs-bucket.yaml \
  --cors-file=infra/gcs-bucket.yaml

# Allow public reads for product images
gcloud storage buckets add-iam-policy-binding gs://doribharat-product-media \
  --member=allUsers --role=roles/storage.objectViewer
```

The `infra/gcs-iam-policy.json` and `infra/gcs-bucket.yaml` files track the IAM, lifecycle, and CORS settings.

### 2) Run the lightweight signing server
The signing endpoint lives at `POST /media/sign-upload` and returns a `uploadUrl` + `publicUrl` pair.

1. Export credentials (the private key should preserve newlines):
   ```bash
   export GCS_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
   export GCS_SERVICE_ACCOUNT_KEY="$(cat key.json | jq -r .private_key)"
   export GCS_BUCKET_NAME="doribharat-product-media"
   export ADMIN_ORIGIN="http://localhost:5173"
   ```
2. Start the server:
   ```bash
   npm run media:server
   ```

### 3) Wire the admin UI
The admin modal now lets you upload from disk. Configure the UI to reach your signing server:
```bash
echo "VITE_MEDIA_API_BASE=http://localhost:4000" > .env.local
```

Uploads call `POST /media/sign-upload` to create a signed URL, upload the file directly to GCS, and persist the returned public URL in `products.images`.
