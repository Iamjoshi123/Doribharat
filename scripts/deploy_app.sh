#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-south1"
SERVICE_NAME="doribharat-api"
DB_INSTANCE_NAME="doribharat-db"
DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-}"

echo -e "${GREEN}Deploying Application to Cloud Run...${NC}"

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# Get current git commit hash
GIT_SHA=$(git rev-parse --short HEAD)
echo -e "${YELLOW}Current Git Commit: ${GIT_SHA}${NC}"

# 1. Build and Submit Container
echo -e "${YELLOW}Building Container Image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:$GIT_SHA --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# 2. Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run (Version: $GIT_SHA)...${NC}"

# Retrieve secrets references
SECRET_DB_PASSWORD="db-password"
SECRET_ADMIN="admin-users-secret"
SECRET_JWT="jwt-signing-secret"

gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GIT_SHA \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="DB_HOST=/cloudsql/$DB_CONNECTION_NAME,DB_USER=doribharat_app,DB_NAME=doribharat,GCS_BUCKET_NAME=${PROJECT_ID}-media,CLOUD_SQL_CONNECTION_NAME=$DB_CONNECTION_NAME,INSTANCE_CONNECTION_NAME=$DB_CONNECTION_NAME,CORS_ALLOWED_ORIGINS=${FRONTEND_ORIGIN},ENABLE_DEBUG_ENDPOINTS=false" \
    --set-secrets="DB_PASSWORD=${SECRET_DB_PASSWORD}:latest,ADMIN_USERS_SECRET=${SECRET_ADMIN}:latest,JWT_SIGNING_KEY_SECRET=${SECRET_JWT}:latest" \
    --add-cloudsql-instances=$DB_CONNECTION_NAME \
    --min-instances=0 \
    --max-instances=2 \
    --port=8080

echo -e "${GREEN}Deployment Complete!${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
echo -e "Service URL: ${YELLOW}$SERVICE_URL${NC}"
