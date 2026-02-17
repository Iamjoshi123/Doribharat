#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-south1" # Default region, can be changed
DB_INSTANCE_NAME="doribharat-db"
DB_NAME="doribharat"
DB_USER="doribharat_app"
SECRET_DB_PASSWORD="db-password"
SECRET_ADMIN="admin-users-secret"
GCS_BUCKET_NAME="${PROJECT_ID}-media"

echo -e "${GREEN}Setting up Infrastructure for Project: $PROJECT_ID in Region: $REGION${NC}"

# 1. Enable APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    servicenetworking.googleapis.com \
    compute.googleapis.com \
    storage.googleapis.com

# 2. Setup Secrets
echo -e "${YELLOW}Setting up Secrets...${NC}"
if ! gcloud secrets describe $SECRET_DB_PASSWORD &>/dev/null; then
    read -sp "Enter DB Password for '$DB_USER': " DB_PASS_INPUT
    echo ""
    printf "$DB_PASS_INPUT" | gcloud secrets create $SECRET_DB_PASSWORD --data-file=-
    echo -e "${GREEN}Secret '$SECRET_DB_PASSWORD' created.${NC}"
else
    echo -e "${GREEN}Secret '$SECRET_DB_PASSWORD' already exists.${NC}"
fi

if ! gcloud secrets describe $SECRET_ADMIN &>/dev/null; then
    read -sp "Enter Admin Password: " ADMIN_PASS_INPUT
    echo ""
    ADMIN_JSON="{\"users\": [{\"username\": \"admin\", \"password\": \"$ADMIN_PASS_INPUT\"}]}"
    printf "$ADMIN_JSON" | gcloud secrets create $SECRET_ADMIN --data-file=-
    echo -e "${GREEN}Secret '$SECRET_ADMIN' created.${NC}"
else
    echo -e "${GREEN}Secret '$SECRET_ADMIN' already exists.${NC}"
fi

SECRET_JWT="jwt-signing-secret"
if ! gcloud secrets describe $SECRET_JWT &>/dev/null; then
    echo -e "${YELLOW}Creating JWT Signing Secret...${NC}"
    # Generate a random 32-char string
    JWT_VAL=$(openssl rand -base64 32)
    printf "$JWT_VAL" | gcloud secrets create $SECRET_JWT --data-file=-
    echo -e "${GREEN}Secret '$SECRET_JWT' created.${NC}"
else
    echo -e "${GREEN}Secret '$SECRET_JWT' already exists.${NC}"
fi

# Grant Access to Secrets
echo -e "${YELLOW}Granting Secret Accessor role to Default Compute Service Account...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"


# 3. Create Cloud Storage Bucket
echo -e "${YELLOW}Creating Cloud Storage Bucket...${NC}"
if ! gsutil ls -b gs://$GCS_BUCKET_NAME &>/dev/null; then
    gsutil mb -l $REGION gs://$GCS_BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$GCS_BUCKET_NAME
    echo -e "${GREEN}Bucket '$GCS_BUCKET_NAME' created and made public readable.${NC}"
else
    echo -e "${GREEN}Bucket '$GCS_BUCKET_NAME' already exists.${NC}"
fi

# 4. Create Cloud SQL Instance (Private IP)
echo -e "${YELLOW}Checking Cloud SQL Instance...${NC}"

# Check for existing instance
if ! gcloud sql instances describe $DB_INSTANCE_NAME &>/dev/null; then
    echo -e "${YELLOW}Creating Cloud SQL instance '$DB_INSTANCE_NAME' (this may take 10-15 mins)...${NC}"
    
    # Generate a random root password
    ROOT_PASS=$(openssl rand -base64 12)
    
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --region=$REGION \
        --tier=db-f1-micro \
        --root-password=$ROOT_PASS \
        --storage-auto-increase
        
    echo -e "${GREEN}Instance created.${NC}"
else
    echo -e "${GREEN}Instance '$DB_INSTANCE_NAME' already exists.${NC}"
fi

# 5. Create Database and User
echo -e "${YELLOW}Configuring Database Users...${NC}"
if ! gcloud sql databases list --instance=$DB_INSTANCE_NAME | grep -q $DB_NAME; then
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
    echo -e "${GREEN}Database '$DB_NAME' created.${NC}"
fi

if ! gcloud sql users list --instance=$DB_INSTANCE_NAME | grep -q $DB_USER; then
    # Retrieve password from secret
    DB_PASS_VAL=$(gcloud secrets versions access latest --secret=$SECRET_DB_PASSWORD)
    gcloud sql users create $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASS_VAL
    echo -e "${GREEN}User '$DB_USER' created.${NC}"
fi

echo -e "${GREEN}Infrastructure Setup Complete!${NC}"
echo -e "Make sure to run 'deploy_app.sh' next."
