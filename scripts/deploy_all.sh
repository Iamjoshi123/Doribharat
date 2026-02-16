#!/bin/bash
set -e

# Configuration
REGION="asia-south1"
SERVICE_NAME="doribharat-app"
DB_INSTANCE_NAME="doribharat-postgres-$(date +%s)"
REPOSITORY_NAME="doribharat-repo"

echo "========================================================"
echo "  Doribharat Cloud Deployment Script"
echo "========================================================"
echo "This script will deploy the entire application to Google Cloud."
echo "Running in project: $(gcloud config get-value project)"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# 1. Enable APIs
echo "--> Enabling APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com

# 2. Secrets
echo "--> configuring Secrets..."
read -s -p "Enter DB Password: " DB_PASS
echo
read -s -p "Enter Admin Password: " ADMIN_PASS
echo

# Create secrets if they don't exist
if ! gcloud secrets describe db-password &>/dev/null; then
  printf "%s" "$DB_PASS" | gcloud secrets create db-password --data-file=-
else
  echo "Secret db-password already exists, skipping creation."
fi

if ! gcloud secrets describe admin-users-secret &>/dev/null; then
  # Create JSON structure
  ADMIN_JSON='{"users": [{"username": "admin", "password": "'"$ADMIN_PASS"'"}]}'
  printf "%s" "$ADMIN_JSON" | gcloud secrets create admin-users-secret --data-file=-
else
  echo "Secret admin-users-secret already exists, skipping creation."
fi

# 3. Infrastructure (Terraform)
echo "--> Provisioning Database (Terraform)..."
cd infra/terraform/cloudsql
# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id = "$(gcloud config get-value project)"
region     = "$REGION"
instance_name = "$DB_INSTANCE_NAME"
db_password = "$DB_PASS"
vpc_network = "projects/$(gcloud config get-value project)/global/networks/default"
EOF

terraform init
terraform apply -auto-approve

# Get DB connection name
INSTANCE_CONNECTION_NAME=$(terraform output -raw instance_connection_name)
cd ../../..

echo "Database provisioned: $INSTANCE_CONNECTION_NAME"

# 4. Migrations
echo "--> Running Database Migrations..."
# Note: This uses Cloud Build to run prisma migrate inside the backend context
gcloud builds submit . \
  --config backend/cloudbuild.migrate.yaml \
  --substitutions=_INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,_DB_USER=doribharat_app,_DB_PASSWORD=$DB_PASS,_DB_NAME=doribharat

# 5. Build & Deploy
echo "--> Building and Deploying to Cloud Run..."
# We use a multi-stage build that builds Frontend + Backend and serves them together
# But first we need to make sure the root Dockerfile does this.

# Submit build to Cloud Build
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/$SERVICE_NAME .

# Deploy
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$(gcloud config get-value project)/$SERVICE_NAME \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DB_USER=doribharat_app,DB_NAME=doribharat,GCS_BUCKET_NAME=doribharat-product-media,PUBLIC_DIR=/app/public \
  --set-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --set-secrets DB_PASSWORD=db-password:latest,ADMIN_USERS_SECRET=admin-users-secret:latest

echo "========================================================"
echo "Deployment Complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')"
echo "========================================================"
