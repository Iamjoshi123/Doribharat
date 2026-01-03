import { randomUUID } from "crypto";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { pool, query } from "../lib/db.js";

export type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  replaced_by_token: string | null;
  revoked_at: string | null;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const constantTimeMatch = (a: string, b: string) => {
  const buffA = Buffer.from(a);
  const buffB = Buffer.from(b);
  return buffA.length === buffB.length && timingSafeEqual(buffA, buffB);
};

export const issueRefreshToken = async (userId: string) => {
  const token = `${randomUUID()}.${randomUUID()}`;
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlHours * 60 * 60 * 1000);
  const id = randomUUID();

  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, tokenHash, expiresAt.toISOString()]
  );

  return { token, id, expiresAt };
};

export const rotateRefreshToken = async (incomingToken: string) => {
  const tokenHash = hashToken(incomingToken);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<RefreshTokenRow>(
      `SELECT *
       FROM refresh_tokens
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    const existing = rows[0];
    if (!existing) throw new Error("Refresh token not found");

    if (existing.revoked_at) throw new Error("Refresh token revoked");
    if (existing.replaced_by_token) throw new Error("Refresh token already rotated");

    const expiresAt = new Date(existing.expires_at);
    if (expiresAt.getTime() < Date.now()) throw new Error("Refresh token expired");

    const newToken = `${randomUUID()}.${randomUUID()}`;
    const newHash = hashToken(newToken);
    const newId = randomUUID();
    const newExpiry = new Date(Date.now() + env.refreshTokenTtlHours * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [newId, existing.user_id, newHash, newExpiry.toISOString()]
    );
    await client.query(
      `UPDATE refresh_tokens
       SET replaced_by_token = $1, revoked_at = now()
       WHERE id = $2`,
      [newId, existing.id]
    );

    await client.query("COMMIT");
    return { token: newToken, userId: existing.user_id, expiresAt: newExpiry };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const revokeRefreshFamily = async (token: string) => {
  const hashed = hashToken(token);
  const { rows } = await query<RefreshTokenRow>(
    `SELECT id, replaced_by_token
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [hashed]
  );
  const root = rows[0];
  if (!root) return;
  await query(
    `UPDATE refresh_tokens
     SET revoked_at = now()
     WHERE id = $1 OR replaced_by_token = $1`,
    [root.id]
  );
};

export const safeCompareRefreshToken = async (token: string) => {
  const hashed = hashToken(token);
  const { rows } = await query<RefreshTokenRow>(
    `SELECT *
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [hashed]
  );
  return rows.find((row) => constantTimeMatch(row.token_hash, hashed)) ?? null;
};
