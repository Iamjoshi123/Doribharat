import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();
const secretCache = new Map<string, string>();

const buildSecretPath = (secret: string, projectId?: string) => {
  if (secret.includes("/")) return secret;
  const pid = projectId || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  return `projects/${pid}/secrets/${secret}/versions/latest`;
};

export const readSecret = async (secretName: string, projectId?: string): Promise<string> => {
  if (secretCache.has(secretName)) return secretCache.get(secretName)!;
  const [response] = await client.accessSecretVersion({
    name: buildSecretPath(secretName, projectId),
  });
  const value = response.payload?.data?.toString("utf8") ?? "";
  secretCache.set(secretName, value);
  return value;
};

export const readJsonSecret = async <T>(secretName: string, projectId?: string): Promise<T> => {
  const payload = await readSecret(secretName, projectId);
  return JSON.parse(payload) as T;
};
