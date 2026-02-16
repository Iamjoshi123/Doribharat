#!/bin/bash
set -e

echo "========================================================"
echo "   ☢️  NUCLEAR CLEANUP SCRIPT ☢️"
echo "   Removing ALL Doribharat Network Resources"
echo "========================================================"

PROJECT_ID=$(gcloud config get-value project)
echo "Project: $PROJECT_ID"
echo "--------------------------------------------------------"

# 1. DELETE VPC PEERING
echo "--> 1. Checking for VPC Peering 'servicenetworking-googleapis-com'..."
if gcloud services vpc-peerings list --network=default --format="value(peerNetwork)" | grep -q "servicenetworking-googleapis-com"; then
    echo "    FOUND! Deleting..."
    gcloud services vpc-peerings delete servicenetworking-googleapis-com --network=default --quiet
    echo "    Deleted."
else
    echo "    Not found (Clean)."
fi

echo "    Waiting 5 seconds..."
sleep 5

# 2. DELETE ORPHANED IP RANGES
echo "--> 2. Scanning for ALL VPC Peering IP Ranges..."
# List ALL global addresses with VPC_PEERING purpose
ranges=$(gcloud compute addresses list --global --filter="purpose=VPC_PEERING" --format="value(name)")

if [ -z "$ranges" ]; then
    echo "    No VPC Peering ranges found (Clean)."
else
    echo "    Found ranges:"
    echo "$ranges"
    echo "    ---------------------------------"
    
    # Filter for our project specific ones or just delete anything that looks like ours
    # We'll be aggressive: Delete anything matching 'doribharat' OR 'google-managed' if safe? 
    # Let's stick to 'doribharat' and the suspicious '-pool' ones.
    
    for range in $ranges; do
        if [[ "$range" == *"doribharat"* ]] || [[ "$range" == *"google-managed"* ]]; then
             echo "    💥 DELETING range: $range"
             gcloud compute addresses delete "$range" --global --quiet || echo "       (Could not delete $range - might be in use?)"
        else
             echo "    Skipping unrelated range: $range"
        fi
    done
fi

# 3. NUKE TERRAFORM STATE
echo "--> 3. Nuking local Terraform state..."
rm -rf infra/terraform/cloudsql/.terraform
rm -f infra/terraform/cloudsql/terraform.tfstate*
rm -f infra/terraform/cloudsql/.terraform.lock.hcl
echo "    Local state deleted."

echo "========================================================"
echo "   ✅ CLEANUP COMPLETE"
echo "========================================================"
echo "Now run ./scripts/deploy_all.sh again."
