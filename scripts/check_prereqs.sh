#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running Pre-flight Checks for Doribharat Deployment...${NC}"

# 1. Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}[ERROR] gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] gcloud CLI is installed.${NC}"

# 2. Check if logged in
AUTH_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
if [ -z "$AUTH_ACCOUNT" ]; then
    echo -e "${RED}[ERROR] You are not logged in. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Logged in as: $AUTH_ACCOUNT${NC}"

# 3. Check if project is set
PROJECT_ID=$(gcloud config get-value project 2> /dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}[ERROR] No GCP project selected. Please run 'gcloud config set project YOUR_PROJECT_ID'.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Project ID: $PROJECT_ID${NC}"

# 4. Check if billing is enabled (optional but recommended check)
BILLING_ENABLED=$(gcloud beta billing projects describe $PROJECT_ID --format="value(billingEnabled)" 2>/dev/null || echo "unknown")
if [ "$BILLING_ENABLED" == "false" ]; then
     echo -e "${RED}[WARNING] Billing is NOT enabled for project $PROJECT_ID. Deployment will likely fail.${NC}"
     echo -e "Please enable billing in the GCP Console."
     read -p "Press Enter to continue anyway or Ctrl+C to abort..."
elif [ "$BILLING_ENABLED" == "unknown" ]; then
     echo -e "${RED}[WARNING] Could not verify billing status. Ensure billing is enabled.${NC}"
fi

echo -e "${GREEN}Pre-flight checks passed! You are ready to proceed.${NC}"
