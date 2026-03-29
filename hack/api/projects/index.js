const { sql, schemaReady } = require('../_lib/db');
const { authenticate } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = authenticate(req);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  await schemaReady;

  // GET /api/projects — list all projects for current user
  if (req.method === 'GET') {
    const projects = await sql`
      SELECT id, name, description, created_at, updated_at
      FROM projects
      WHERE user_id = ${payload.userId}
      ORDER BY updated_at DESC
    `;
    return res.json({ projects });
  }

  // POST /api/projects — create a new project
  if (req.method === 'POST') {
    const { name, description, files, metadata } = req.body ?? {};

    if (!name || !files) {
      return res.status(400).json({ error: 'Name and files are required' });
    }

    const filesJson = typeof files === 'string' ? files : JSON.stringify(files);
    const metaJson = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

    const [project] = await sql`
      INSERT INTO projects (user_id, name, description, files, metadata)
      VALUES (${payload.userId}, ${name}, ${description || ''}, ${filesJson}, ${metaJson})
      RETURNING id, name, description, created_at, updated_at
    `;

    return res.status(201).json({ project });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
