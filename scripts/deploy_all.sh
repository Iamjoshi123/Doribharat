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

# 0. Robust Authentication Check & Fix
# 0. Robust Authentication Check & Fix
echo "--> Checking Authentication Status..."

# DEFINITION: Where we WANT the credentials to live
ADC_FILE="$HOME/.config/gcloud/application_default_credentials.json"
mkdir -p $(dirname "$ADC_FILE")

# CRITICAL: Export this EARLY so 'gcloud auth application-default login' saves it here!
export GOOGLE_APPLICATION_CREDENTIALS="$ADC_FILE"
echo "--> Configured Credential Path: $ADC_FILE"

# CHECK 1: gcloud CLI (For running gcloud commands)
if ! gcloud auth print-access-token >/dev/null 2>&1; then
  echo "========================================================"
  echo "⚠️  GCLOUD CLI NOT AUTHENTICATED"
  echo "We need to log you in to run 'gcloud' commands."
  echo "========================================================"
  gcloud auth login --quiet --no-launch-browser
fi

# CHECK 2: Application Default Credentials (For Terraform)
if [ ! -f "$ADC_FILE" ]; then
  echo "========================================================"
  echo "⚠️  ADC CREDENTIALS MISSING"
  echo "Terraform needs specific credentials to provision resources."
  echo "Launching authentication flow..."
  echo "========================================================"
  gcloud auth application-default login --quiet --no-launch-browser
fi

# RE-CHECK: Did the file actually get created?
if [ ! -f "$ADC_FILE" ]; then
  echo "========================================================"
  echo "❌ CRITICAL AUTH ERROR: Credentials file not found!"
  echo "Expected path: $ADC_FILE"
  echo "The login command failed or wrote to a weird location."
  echo "Please run this MANUALLY:"
  echo "  export GOOGLE_APPLICATION_CREDENTIALS=$ADC_FILE"
  echo "  gcloud auth application-default login"
  echo "========================================================"
  exit 1
fi

echo "--> Auth Configured: Using explicit credentials from $ADC_FILE"
echo "--> Auth Configured: Using explicit credentials from $ADC_FILE"
echo "--> Project: $(gcloud config get-value project)"

# 1. Enable APIs
echo "--> Enabling APIs..."
gcloud services enable \
  serviceusage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com \
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

# CLEANUP: Remove interfering VPC peering from previous failed runs
# Terraform fails if a peering exists but the local state is lost (Error code 9)
# FORCE CLEANUP: Attempt to delete conflicting network resources unconditionally
# We don't check "if exists" because grep can be flaky. Just try to delete.
echo "--> [CLEANUP] Ensuring clean network state..."

# 1. Delete Peering (The connection to Google Services)
echo "    > Detaching old VPC peering (servicenetworking-googleapis-com)..."
gcloud services vpc-peerings delete servicenetworking-googleapis-com --network=default --quiet || echo "      (Peering not found or already deleted - This is OK)"

# Wait for potential lingering operations
sleep 5

# 2. Delete Orphaned IP Ranges (The address blocks)
echo "    > Checking for orphaned Cloud SQL IP ranges..."
# Find ANY range starting with "doribharat-postgres-"
OLD_RANGES=$(gcloud compute addresses list --global --filter="name:doribharat-postgres-*" --format="value(name)")

if [ -n "$OLD_RANGES" ]; then
   echo "      [CLEANUP] Found orphaned ranges: $OLD_RANGES"
   # Delete them all
   echo "$OLD_RANGES" | xargs -r gcloud compute addresses delete --global --quiet
   echo "      [CLEANUP] Waiting 10 seconds for deletion to propagate..."
   sleep 10
else
   echo "      No orphaned ranges found. Clean."
fi

# 3. Nuke local Terraform state to force fresh initialization
echo "    > Removing local Terraform state to prevent conflicts..."
rm -rf infra/terraform/cloudsql/.terraform
rm -f infra/terraform/cloudsql/terraform.tfstate*
rm -f infra/terraform/cloudsql/.terraform.lock.hcl

cd infra/terraform/cloudsql
# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id = "$(gcloud config get-value project)"
region     = "$REGION"
instance_name = "$DB_INSTANCE_NAME"
db_password = "$DB_PASS"
vpc_network = "projects/$(gcloud config get-value project)/global/networks/default"
EOF

terraform init -reconfigure
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
