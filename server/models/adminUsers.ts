import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { query } from "../lib/db.js";

export type AdminUser = {
  id: string;
  username: string;
  password_hash: string;
};

type BootstrapAdminUser = {
  username: string;
  password?: string;
  passwordHash?: string;
};

const normalizeBootstrapUser = (user: BootstrapAdminUser): BootstrapAdminUser => {
  if (!user.username) {
    throw new Error("Bootstrap admin user requires username");
  }
  if (!user.password && !user.passwordHash) {
    throw new Error(`Bootstrap admin user ${user.username} requires a password or passwordHash`);
  }
  return user;
};

export const findAdminByUsername = async (username: string): Promise<AdminUser | null> => {
  const result = await query<AdminUser>(
    `SELECT id, username, password_hash
     FROM admin_users
     WHERE username = $1
     LIMIT 1`,
    [username]
  );
  return result.rows[0] ?? null;
};

export const findAdminById = async (id: string): Promise<AdminUser | null> => {
  const result = await query<AdminUser>(
    `SELECT id, username, password_hash
     FROM admin_users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
};

export const validateAdminPassword = async (user: AdminUser, password: string) => {
  return bcrypt.compare(password, user.password_hash);
};

export const syncBootstrapAdmins = async (rawUsers: BootstrapAdminUser[]) => {
  const users = rawUsers.map(normalizeBootstrapUser);
  for (const user of users) {
    const existing = await findAdminByUsername(user.username);
    const passwordHash =
      user.passwordHash || (user.password ? await bcrypt.hash(user.password, 12) : undefined);

    if (!passwordHash) continue;

    if (!existing) {
      await query(
        `INSERT INTO admin_users (id, username, password_hash)
         VALUES ($1, $2, $3)`,
        [randomUUID(), user.username, passwordHash]
      );
    } else if (existing.password_hash !== passwordHash) {
      await query(`UPDATE admin_users SET password_hash = $2 WHERE id = $1`, [
        existing.id,
        passwordHash,
      ]);
    }
  }
};
