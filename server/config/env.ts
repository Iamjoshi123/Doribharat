import assert from "node:assert";

const numberFromEnv = (value: string | undefined, fallback: number) =>
  value ? Number.parseInt(value, 10) : fallback;

const required = (value: string | undefined, name: string) => {
  assert(value && value.length > 0, `${name} environment variable is required`);
  return value;
};

export const env = {
  port: numberFromEnv(process.env.PORT, 8080),
  publicDir: process.env.PUBLIC_DIR,
  databaseUrl:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@/${process.env.DB_NAME}?host=/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
  jwtSigningKeySecret: required(process.env.JWT_SIGNING_KEY_SECRET, "JWT_SIGNING_KEY_SECRET"),
  adminUsersSecret: required(process.env.ADMIN_USERS_SECRET, "ADMIN_USERS_SECRET"),
  accessTokenTtlSeconds: numberFromEnv(process.env.ACCESS_TOKEN_TTL_SECONDS, 900),
  refreshTokenTtlHours: numberFromEnv(process.env.REFRESH_TOKEN_TTL_HOURS, 24 * 30),
  jwtAlgorithm: (process.env.JWT_ALGORITHM || "HS256") as "HS256",
  projectId: process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
};
