# 🚀 Doribharat Fresh Deployment Guide

You requested a clean slate. Here is the **Single Button** solution.

This automated script will:
1.  Enable all necessary APIs.
2.  Set up the Network and Database (correctly).
3.  **Automatically Fix** the permissions error you saw (Secret Manager Access).
4.  Deploy the App and run Migrations.

---

## Step 1: Login (Do not skip)
Run this command in your terminal. If asked, click the link and authorize.

```bash
gcloud auth login --no-launch-browser
```

## Step 2: Run the Fresh Deploy Script
Copy and run this single command:

```bash
chmod +x scripts/deploy_fresh.sh
./scripts/deploy_fresh.sh
```

*(This will take about 10-15 minutes because creating a database takes time. Grab a coffee ☕)*

## Step 3: Done
At the end, the script will print your **Website URL**.

---

### What if it fails?
If something weird happens, just run:
```bash
./scripts/nuke.sh
```
And then try **Step 2** again.
