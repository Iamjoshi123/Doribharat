#!/bin/bash
set -e

# ========================================================================================
# 🚀 DORIBHARAT FRESH DEPLOYMENT SCRIPT (No Terraform)
# ========================================================================================
# This script uses raw 'gcloud' commands to deploy everything.
# It is robust, stateless, and fixes common permission issues automatically.
# ========================================================================================

APP_NAME="doribharat"
REGION="asia-south1"
DB_INSTANCE_NAME="${APP_NAME}-db-v2"
DB_NAME="doribharat"
DB_USER="doribharat_app"
REPO_NAME="doribharat-repo"

# ----------------------------------------------------------------------------------------
# 0. AUTH & PRE-FLIGHT
# ----------------------------------------------------------------------------------------
echo "--> [1/7] Checking Authentication..."
PROJECT_ID=$(gcloud config get-value project)
echo "    Project ID: $PROJECT_ID"
echo "    Region:     $REGION"

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ Error: No project selected. Run 'gcloud config set project YOUR_PROJECT_ID'"
  exit 1
fi

# Enable APIs
echo "--> [2/7] Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --quiet

# ----------------------------------------------------------------------------------------
# 1. SETUP NETWORKING (The tricky part)
# ----------------------------------------------------------------------------------------
echo "--> [3/7] Configuring Networking (Private Service Access)..."

# Check if peering exists
if ! gcloud services vpc-peerings list --network=default | grep -q "servicenetworking-googleapis-com"; then
  echo "    Creating VPC Peering..."
  # Allocating IP range
  gcloud compute addresses create google-managed-services-default \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --description="Peering for Google Services" \
    --network=default || echo "    (Address might already exist, continuing...)"

  # Create connection
  gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=google-managed-services-default \
    --network=default \
    --project=$PROJECT_ID || echo "    (Peering might already define, continuing...)"
else
  echo "    VPC Peering already exists. Good."
fi

# ----------------------------------------------------------------------------------------
# 2. DATABASE & SECRETS
# ----------------------------------------------------------------------------------------
echo "--> [4/7] Setting up Cloud SQL & Secrets..."

# Generate or Get Password
DB_PASSWORD=$(openssl rand -base64 20 | tr -dc 'a-zA-Z0-9')

# Create DB Instance if not exists
if ! gcloud sql instances describe $DB_INSTANCE_NAME >/dev/null 2>&1; then
  echo "    Creating Cloud SQL Instance '$DB_INSTANCE_NAME' (This takes ~5-10 mins)..."
  gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --cpu=1 --memory=3840MiB \
    --region=$REGION \
    --root-password=$DB_PASSWORD \
    --network=default \
    --no-assign-ip \
    --quiet
else
  echo "    DB Instance '$DB_INSTANCE_NAME' already exists."
  # We won't reset the root password here to avoid breaking things, 
  # but for a FRESH install we assume we can set the app user password.
fi

# Create Database
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME --quiet || echo "    Database already exists."

# Create User
gcloud sql users create $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD --quiet || \
  gcloud sql users set-password $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD --quiet

# --- SECRETS MANAGEMENT ---
echo "    Storing Database Password in Secret Manager..."
echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=- --replication-policy=automatic --quiet || \
echo -n "$DB_PASSWORD" | gcloud secrets versions add db-password --data-file=- --quiet

# Admin Secret dummy
echo -n '{"users":[{"username":"admin","password":"password123"}]}' | gcloud secrets create admin-users-secret --data-file=- --replication-policy=automatic --quiet || \
echo -n '{"users":[{"username":"admin","password":"password123"}]}' | gcloud secrets versions add admin-users-secret --data-file=- --quiet

# *** CRITICAL FIX FOR YOUR SCREENSHOT ERROR ***
# Grant 'Secret Accessor' role to the Default Compute Service Account (used by Cloud Run)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "    Granting Secret Accessor role to $COMPUTE_SA..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/secretmanager.secretAccessor" --quiet
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/cloudsql.client" --quiet

# ----------------------------------------------------------------------------------------
# 3. DEPLOYMENT
# ----------------------------------------------------------------------------------------
echo "--> [5/6] Deploying App..."

DB_CONN_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"
JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9')

echo "    Storing JWT Secret..."
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- --replication-policy=automatic --quiet || \
echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=- --quiet

# Fetch Gemini API Key from Secret Manager
GEMINI_API_KEY=$(gcloud secrets versions access latest --secret="gemini-api-key" || echo "")

# FIXED: Env vars to match backend/src/config/env.ts
gcloud run deploy doribharat-api \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DB_HOST="/cloudsql/${DB_CONN_NAME}",DB_USER="${DB_USER}",DB_NAME="${DB_NAME}",CLOUD_SQL_CONNECTION_NAME="${DB_CONN_NAME}",GCS_BUCKET_NAME="doribharat-media-${PROJECT_ID}" \
  --set-secrets DB_PASSWORD=db-password:latest,ADMIN_USERS_SECRET=admin-users-secret:latest,JWT_SIGNING_KEY_SECRET=jwt-secret:latest \
  --set-build-env-vars GEMINI_API_KEY="${GEMINI_API_KEY}" \
  --add-cloudsql-instances ${DB_CONN_NAME} \
  --quiet

# ----------------------------------------------------------------------------------------
# 4. MIGRATION
# ----------------------------------------------------------------------------------------
echo "--> [6/6] Running Migrations..."
# We use a trick: create a temporary Job to run the migration
# Migration job also needs these envs to connect
gcloud run jobs deploy doribharat-migrate \
  --source . \
  --region $REGION \
  --command "npx","prisma","migrate","deploy" \
  --set-env-vars DB_HOST="/cloudsql/${DB_CONN_NAME}",DB_USER="${DB_USER}",DB_NAME="${DB_NAME}",CLOUD_SQL_CONNECTION_NAME="${DB_CONN_NAME}",JWT_SIGNING_KEY_SECRET="${JWT_SECRET}" \
  --set-secrets DB_PASS=db-password:latest \
  --add-cloudsql-instances ${DB_CONN_NAME} \
  --quiet
gcloud run jobs execute doribharat-migrate --region $REGION --wait

echo "========================================================================================"
echo "✅ DEPLOYMENT COMPLETE!"
SERVICE_URL=$(gcloud run services describe doribharat-api --region $REGION --format 'value(status.url)')
echo "🌍 Website URL: $SERVICE_URL"
echo "========================================================================================"
