import { env } from "../config/env.js";
import { readJsonSecret } from "../lib/secretManager.js";
import { syncBootstrapAdmins } from "../models/adminUsers.js";
import { ensureSchema } from "../models/schema.js";

type AdminSecretShape =
  | {
      users: { username: string; password?: string; passwordHash?: string }[];
    }
  | { username: string; password?: string; passwordHash?: string }[];

export const bootstrap = async () => {
  await ensureSchema();
  const adminSecret = await readJsonSecret<AdminSecretShape>(env.adminUsersSecret, env.projectId);
  const users = Array.isArray(adminSecret) ? adminSecret : adminSecret.users;
  if (!users || users.length === 0) {
    throw new Error("No admin users found in ADMIN_USERS_SECRET");
  }
  await syncBootstrapAdmins(users);
};
