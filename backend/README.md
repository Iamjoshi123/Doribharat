# Backend database & migrations

This folder holds the Prisma schema, migrations, and automation for the Doribharat Postgres database.

## Data model (Prisma)
- **categories** – unique `name`, optional `image_url`/`description`
- **products** – belongs to a category, SEO-friendly `slug`, pricing (`selling_price`, `retail_price`), stock, media (`images`), JSONB `specifications`/`flags`
- **orders** – generated `order_number`, customer contact fields, status, totals, JSONB `shipping_address`
- **order_items** – line items connecting orders to products

Prisma schema lives in `prisma/schema.prisma`, and the initial SQL migration is in `prisma/migrations/20241001000000_init/migration.sql`.

## Connection strings
- **Local (Cloud SQL Auth Proxy, private IP):** `postgresql://<DB_USER>:<DB_PASSWORD>@127.0.0.1:5432/<DB_NAME>?sslmode=disable`
- **Cloud Run (Unix socket):** `postgresql://<DB_USER>:<DB_PASSWORD>@/<DB_NAME>?host=/cloudsql/<PROJECT_ID>:<REGION>:<INSTANCE_NAME>&sslmode=disable`

Copy `.env.example` to `.env` and set the values that apply to your environment.

## Local development via Cloud SQL Auth Proxy
1. Start the proxy (requires `roles/cloudsql.client`):
   ```bash
   ./cloud-sql-proxy \
     --address=0.0.0.0 \
     --port=5432 \
     --private-ip \
     <PROJECT_ID>:<REGION>:<INSTANCE_NAME>
   ```
2. In a new terminal, run Prisma commands using the proxy endpoint:
   ```bash
   cd backend
   export DATABASE_URL="postgresql://doribharat_app:<PASSWORD>@127.0.0.1:5432/doribharat?sslmode=disable"
   npm install
   npx prisma migrate deploy
   ```

## Cloud Run configuration
- Mount the Cloud SQL instance as a Unix domain socket and set `DATABASE_URL` to the socket-based string above.
- Ensure the Cloud Run service account has `roles/cloudsql.client` and access to the database user password (Secret Manager recommended).

## Cloud Build migration job
Use `backend/cloudbuild.migrate.yaml` to run migrations in CI:
```bash
gcloud builds submit . \
  --config backend/cloudbuild.migrate.yaml \
  --substitutions=_INSTANCE_CONNECTION_NAME=<PROJECT:REGION:INSTANCE>,_DB_USER=doribharat_app,_DB_PASSWORD=<SECRET>,_DB_NAME=doribharat
```
- The first step starts the Cloud SQL Auth Proxy in private IP mode.
- The second step installs Prisma and applies migrations with `prisma migrate deploy`.

## Modifying the schema
1. Update `prisma/schema.prisma`.
2. Create a new migration (requires access to a Postgres database):
   ```bash
   npx prisma migrate dev --name <change-name>
   ```
3. Commit the generated files under `prisma/migrations`.
