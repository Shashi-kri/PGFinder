// config/db.js
// PostgreSQL connection pool (node-postgres).
// A single shared pool is created per process and reused across requests.

import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // Fail fast on boot rather than on the first query.
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Managed Postgres (Render, Supabase, RDS, etc.) usually needs SSL.
  // Toggle via env so local dev over plain TCP still works.
  ssl:
    process.env.PGSSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  max: Number(process.env.PG_POOL_MAX ?? 10),   // max clients in the pool
  idleTimeoutMillis: 30_000,                     // close idle clients after 30s
  connectionTimeoutMillis: 5_000,                // error if a connection can't be had in 5s
});

// Surface unexpected errors on idle clients instead of crashing silently.
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Run a parameterized query against the pool.
 * @param {string} text - SQL with $1, $2, ... placeholders.
 * @param {Array}  params - values for the placeholders.
 * @returns {Promise<import('pg').QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client for a transaction. Caller MUST release it.
 * Usage:
 *   const client = await getClient();
 *   try { await client.query('BEGIN'); ...; await client.query('COMMIT'); }
 *   catch (e) { await client.query('ROLLBACK'); throw e; }
 *   finally { client.release(); }
 */
export const getClient = () => pool.connect();

export default pool;
