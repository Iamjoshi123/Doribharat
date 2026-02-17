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
GCS_BUCKET_NAME="${PROJECT_ID}-media"

echo -e "${RED}WARNING: This will DELETE all resources for Doribharat (Service, DB, Bucket).${NC}"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo -e "${YELLOW}Deleting Cloud Run Service...${NC}"
gcloud run services delete $SERVICE_NAME --region $REGION --quiet || echo "Service not found or already deleted."

echo -e "${YELLOW}Deleting Cloud SQL Instance...${NC}"
gcloud sql instances delete $DB_INSTANCE_NAME --quiet || echo "Instance not found or already deleted."

echo -e "${YELLOW}Deleting GCS Bucket...${NC}"
gsutil rm -r gs://$GCS_BUCKET_NAME || echo "Bucket not found or already deleted."

echo -e "${GREEN}Cleanup Complete.${NC}"
