import dotenv from 'dotenv';
import assert from "node:assert";

dotenv.config();

if (process.env.DISABLE_GCP_SERVICES === 'true ' || process.env.DISABLE_GCP_SERVICES === 'true\r') {
  process.env.DISABLE_GCP_SERVICES = 'true';
}


export interface AppConfig {
  port: number;
  googleCloudProject: string;
  dbUser: string;
  dbPass: string;
  dbName: string;
  cloudSqlConnectionName: string;
  jwtSigningKeySecret: string;
  adminUsersSecret: string;
  // Added missing fields
  gcsBucket: string;
  dbInstance: string;
}

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Helper to force the app to crash if a required secret is missing
const required = (value: string | undefined, name: string): string => {
  assert(value && value.length > 0, `${name} environment variable is required`);
  return value;
};

export const loadConfig = (): AppConfig => {
  return {
    port: numberFromEnv(process.env.PORT, 8080),
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || '',

    // Database Config
    dbUser: required(process.env.DB_USER, "DB_USER"),
    dbPass: required(process.env.DB_PASSWORD, "DB_PASSWORD"),
    dbName: required(process.env.DB_NAME, "DB_NAME"),
    cloudSqlConnectionName: required(process.env.CLOUD_SQL_CONNECTION_NAME, "CLOUD_SQL_CONNECTION_NAME"),

    // Auth Secrets
    jwtSigningKeySecret: required(process.env.JWT_SIGNING_KEY_SECRET, "JWT_SIGNING_KEY_SECRET"),
    adminUsersSecret: required(process.env.ADMIN_USERS_SECRET, "ADMIN_USERS_SECRET"),

    // Added missing fields
    gcsBucket: process.env.GCS_BUCKET_NAME || '',
    dbInstance: process.env.DB_INSTANCE_NAME || ''
  };
};
