#!/bin/bash
set -e

# ========================================================================================
# 🚀 DORIBHARAT FRONTEND DEPLOYMENT SCRIPT
# ========================================================================================

REGION="asia-south1"
APP_NAME="doribharat"

echo "--> [1/4] Checking Prerequisites..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it: npm install -g firebase-tools"
    exit 1
fi

# Get Backend URL if not provided
if [ -z "$VITE_CLOUD_RUN_BASE_URL" ]; then
    echo "    Fetching Backend URL from Cloud Run..."
    VITE_CLOUD_RUN_BASE_URL=$(gcloud run services describe doribharat-api --region $REGION --format 'value(status.url)')
    echo "    Backend URL: $VITE_CLOUD_RUN_BASE_URL"
fi

if [ -z "$VITE_CLOUD_RUN_BASE_URL" ]; then
    echo "❌ Could not find Backend URL. Is the backend deployed?"
    exit 1
fi

echo "--> [2/4] Configuring Environment..."
# Create a temporary .env.production for the build
cat > .env.production <<EOF
VITE_CLOUD_RUN_BASE_URL=$VITE_CLOUD_RUN_BASE_URL
VITE_FRONTEND_ORIGIN=${VITE_FRONTEND_ORIGIN:-""}
VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY:-""}
EOF

echo "--> [3/4] Building Frontend..."
# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build
npm run build

echo "--> [4/4] Deploying to Firebase Hosting..."
# Initialize Firebase if not present (this might require user interaction first time)
if [ ! -f "firebase.json" ]; then
    echo "⚠️  firebase.json not found. You need to run 'firebase init hosting' first manually!"
    exit 1
fi

firebase deploy --only hosting

echo "✅ DONE! Frontend Deployed."
