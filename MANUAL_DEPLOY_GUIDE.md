# Manual Deployment Guide (UI-Based)

Since the automated scripts are facing authentication issues in Cloud Shell, we will deploy strictly using the **Google Cloud Console UI**. This is more reliable as it uses your browser's session.

## 1. Enable APIs
1.  Go to **[APIs & Services > Library](https://console.cloud.google.com/apis/library)**.
2.  Search for and **ENABLE** the following API is they are not enabled:
    *   **Cloud SQL Admin API**
    *   **Cloud Run Admin API**
    *   **Secret Manager API**
    *   **Cloud Build API**
    *   **Service Networking API**

## 2. Create the Database (Cloud SQL)
1.  Go to **[SQL](https://console.cloud.google.com/sql)** Check if you have any instance there.
2.  Click **Create Instance** -> **Choose PostgreSQL**.
3.  **Instance ID**: `doribharat-db`
4.  **Password**: Generat a strong password and **SAVE IT** (you will need it later).
5.  **Database version**: PostgreSQL 15 (or 16).
6.  **Configuration env**: Choose **Sandbox** (cheaper) or Production.
7.  **Region**: `asia-south1` (Mumbai) or your preferred region.
8.  **Connections**:
    *   Uncheck **Public IP**.
    *   Check **Private IP**.
    *   Network: `default`.
    *   (It may ask to "Set up Private Service Access" -> Click **Enable API** if prompted -> **Use an automatically allocated IP range** -> **Continue** -> **Create Connection**).
9.  Click **Create Instance**. (This takes 5-10 minutes).

### Create User & DB
1.  Once the instance is ready, click on it.
2.  Go to **Databases** (left menu) -> **Create Database** -> Name it `doribharat`.
3.  Go to **Users** (left menu) -> **Add User Account**.
    *   **Username**: `doribharat_app`
    *   **Password**: set a password (save this too!).

## 3. Create Secrets (Secret Manager)
1.  Go to **[Security > Secret Manager](https://console.cloud.google.com/security/secret-manager)**.
2.  **Create Secret**:
    *   Name: `db-password`
    *   Secret value: (The password for `doribharat_app` you just created).
3.  **Create Secret**:
    *   Name: `admin-users-secret`
    *   Secret value: `{"users": [{"username": "admin", "password": "YOUR_ADMIN_PASSWORD"}]}`

## 4. Deploy Backend & Frontend (Cloud Run)
We will deploy the code directly from your source.

1.  Go to **[Cloud Run](https://console.cloud.google.com/run)**.
2.  Click **Deploy Container** -> **Service**.
3.  **Source repository**:
    *   Select **Deploy from source code**.
    *   Click **Setup Cloud Build**.
    *   **Repository Provider**: GitHub.
    *   **Repository**: Select your `Doribharat` repo.
    *   **Branch**: `main`.
    *   **Build Type**: Go, Node.js, Python... -> Select **Dockerfile** name `Dockerfile`.
    *   Click **Save**.
4.  **Service Name**: `doribharat-api`.
5.  **Region**: `asia-south1`.
6.  **Authentication**: Allow unauthenticated invocations (Check this).
7.  **Container, Networking, Security** (Expand this arrow at the bottom):
    *   **Variables & Secrets** (Tab):
        *   **Environment Variables**:
            *   `DB_HOST`: `/cloudsql/PROJECT_ID:REGION:doribharat-db` (Copy the "Connection name" from your SQL instance Overview page).
            *   `DB_USER`: `doribharat_app`
            *   `DB_NAME`: `doribharat`
            *   `GCS_BUCKET_NAME`: `doribharat-product-media` (Create a bucket in GCS first if you want).
        *   **Secrets**:
            *   Click **Add Secret**.
            *   **Name**: `DB_PASSWORD` -> source: `db-password` -> version `latest`.
            *   **Name**: `ADMIN_USERS_SECRET` -> source: `admin-users-secret` -> version `latest`.
    *   **Cloud SQL connections** (Tab):
        *   Click **Add Connection**.
        *   Select your `doribharat-db` instance from the dropdown.
8.  Click **Create**.

## 5. Deployment Verification
1.  Cloud Run will start building your code. You can view the logs.
2.  Once green, click the **URL** provided at the top.
3.  You should see your application.

## 6. Run Migrations (One-time)
Since we can't easily run the migration script without CLI, we can try to connect to the DB using **Cloud SQL Studio** in the console to create tables, OR (easier) run the migration locally if you have the `.env` connected to the public IP (if you enabled it), but for now, let's see if the app deploys first.

*Note: The app might crash initially if tables are missing. We will solve that next.*
