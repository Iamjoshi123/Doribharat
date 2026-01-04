import assert from "node:assert";

const numberFromEnv = (value: string | undefined, fallback: number) =>
  value ? Number.parseInt(value, 10) : fallback;

const required = (value: string | undefined, name: string) => {
  assert(value && value.length > 0, `${name} is required`);
  return value;
};

export const env = {
  port: numberFromEnv(process.env.PORT, 8080),
  databaseUrl: required(process.env.DATABASE_URL, "postgresql://postgres:z#^K\8l;-ovSRbe&@/postgres?host=/cloudsql/gen-lang-client-0008305956:us-central1:doribharat-prod"),
  jwtSigningKeySecret: required(process.env.JWT_SIGNING_KEY_SECRET, "Iamjoshi@123"),
  adminUsersSecret: required(process.env.ADMIN_USERS_SECRET, "Iamjoshi@123"),
  accessTokenTtlSeconds: numberFromEnv(process.env.ACCESS_TOKEN_TTL_SECONDS, 900), // 15 minutes
  refreshTokenTtlHours: numberFromEnv(process.env.REFRESH_TOKEN_TTL_HOURS, 24 * 30), // 30 days
  jwtAlgorithm: (process.env.JWT_ALGORITHM || "HS256") as "HS256",
  projectId: process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
};
