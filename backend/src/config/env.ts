import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  googleCloudProject: string;
  dbInstance: string;
  dbUser: string;
  dbPass: string;
  dbName: string;
  cloudSqlConnectionName: string;
  gcsBucket: string;
}

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const loadConfig = (): AppConfig => {
  return {
    port: numberFromEnv(process.env.PORT, 8080),
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT ?? '',
    dbInstance: process.env.DB_INSTANCE ?? '',
    dbUser: process.env.DB_USER ?? '',
    dbPass: process.env.DB_PASS ?? '',
    dbName: process.env.DB_NAME ?? '',
    cloudSqlConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME ?? '',
    gcsBucket: process.env.GCS_BUCKET ?? ''
  };
};
