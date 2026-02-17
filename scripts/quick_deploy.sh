#!/bin/bash
set -e

# ========================================================================================
# 🚀 QUICK UPDATE SCRIPT
# ========================================================================================
# ONLY updates the code on Cloud Run.
# Assumes Database and Networking are already set up.
# ========================================================================================

APP_NAME="doribharat"
REGION="asia-south1"
DB_INSTANCE_NAME="${APP_NAME}-db-v2"
DB_NAME="doribharat"
DB_USER="doribharat_app"

echo "--> [1/2] Checking Configuration..."
PROJECT_ID=$(gcloud config get-value project)
echo "    Project ID: $PROJECT_ID"

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ Error: No project selected."
  exit 1
fi

# Re-calculate connection info
DB_CONN_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"

# Reuse existing secrets or generate new JWT for this revision (Rotating JWT on deploy is fine/secure)
JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9')

echo "--> [2/2] Deploying New Code to Cloud Run..."

gcloud run deploy doribharat-api \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DB_HOST="/cloudsql/${DB_CONN_NAME}",DB_USER="${DB_USER}",DB_NAME="${DB_NAME}",CLOUD_SQL_CONNECTION_NAME="${DB_CONN_NAME}",JWT_SIGNING_KEY_SECRET="${JWT_SECRET}",GCS_BUCKET_NAME="doribharat-media-${PROJECT_ID}" \
  --set-secrets DB_PASS=db-password:latest,ADMIN_USERS_SECRET=admin-users-secret:latest \
  --add-cloudsql-instances ${DB_CONN_NAME} \
  --quiet

echo "========================================================================================"
echo "✅ UPDATE COMPLETE!"
SERVICE_URL=$(gcloud run services describe doribharat-api --region $REGION --format 'value(status.url)')
echo "🌍 Website URL: $SERVICE_URL"
echo "========================================================================================"
