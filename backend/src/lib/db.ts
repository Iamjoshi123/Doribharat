import { Pool, PoolClient } from 'pg';

const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
const socketPath = process.env.DB_SOCKET_PATH ?? '/cloudsql';
const host = instanceConnectionName ? `${socketPath}/${instanceConnectionName}` : process.env.DB_HOST;

const pool = new Pool({
  host,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  // console.log('Acquiring DB client...'); // Debug log
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
