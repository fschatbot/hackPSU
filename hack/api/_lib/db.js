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
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      files       TEXT NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)
  `;
  // Session metadata column (open tabs, active file, theme, etc.)
  await sql`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata TEXT DEFAULT '{}'
  `;
})().catch((err) => {
  console.error('Schema init failed:', err);
});

module.exports = { sql, schemaReady };
