-- Manual SQL bootstrap for Doribharat Postgres
-- Use this if provisioning outside Terraform (e.g., Cloud SQL console or gcloud)

-- 1) Create application database and user (run as a superuser)
CREATE DATABASE doribharat;

CREATE USER doribharat_app WITH PASSWORD 'replace-with-strong-password';

GRANT ALL PRIVILEGES ON DATABASE doribharat TO doribharat_app;

-- 2) Connect to the database and enable extensions required by the migrations
-- \c doribharat
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
