import { Pool } from "pg";
import { env } from "../config/env.js";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
});

export const query = <T>(text: string, params?: unknown[]) => pool.query<T>(text, params);
