const { neon } = require('@neondatabase/serverless');

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set. Add it in the Vercel dashboard.');
}

const sql = neon(process.env.POSTGRES_URL);

// Kicked off at module load (once per Lambda cold start).
// CREATE TABLE IF NOT EXISTS is idempotent — safe to run every cold start.
const schemaReady = (async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name        TEXT NOT NULL,
      avatar      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
})().catch((err) => {
  console.error('Schema init failed:', err);
});

module.exports = { sql, schemaReady };
