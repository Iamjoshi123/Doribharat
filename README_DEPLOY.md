# 🚀 Doribharat Fresh Deployment Guide

> **Goal**: Deploy the entire app (Database + Backend) with a single script.

This automated script will:
1.  Enable all necessary Google Cloud APIs.
2.  Set up the Network and Database (Postgres).
3.  **Automatically Fix** permissions errors (Secret Manager, Cloud SQL).
4.  Deploy the Backend to Cloud Run.
5.  Run Database Migrations.

---

## Step 1: Login (Critical)
Run this command. If asked, click the link and authorize.

```bash
gcloud auth login --no-launch-browser
```

## Step 2: Get Latest Code
**IMPORTANT**: Ensure you have the latest fixes.

```bash
git pull
```

## Step 3: Run the Fresh Deploy Script
Copy and run this command:

```bash
chmod +x scripts/deploy_fresh.sh
./scripts/deploy_fresh.sh
```

*(This will take about 10-15 minutes because creating a database takes time. Grab a coffee ☕)*

---

## Step 4: Verification
At the end, the script will print your **Service URL**.
Open that URL in your browser. You should see `{"status":"ok"}` or the app interface.

---

### ⚠️ Troubleshooting
If the script fails or gets stuck:

1.  **"Container failed to start"**:
    - Run `git pull` again. We fixed a bug in the Dockerfile.
    - Run `./scripts/deploy_fresh.sh` again.

2.  **"Already exists" errors**:
    - These are fine. The script is smart enough to skip what's already done.

3.  **Total Reset (Nuclear Option)**:
    - If everything is broken and you want to start over:
    ```bash
    ./scripts/nuke.sh
    ```
    - Then run `deploy_fresh.sh` again.
