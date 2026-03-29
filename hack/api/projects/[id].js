const { sql, schemaReady } = require('../_lib/db');
const { authenticate } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = authenticate(req);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  await schemaReady;

  const projectId = req.query.id;

  // GET /api/projects/:id — fetch single project with files
  if (req.method === 'GET') {
    const [project] = await sql`
      SELECT id, name, description, files, metadata, created_at, updated_at
      FROM projects
      WHERE id = ${projectId} AND user_id = ${payload.userId}
    `;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    try { project.files = JSON.parse(project.files); } catch { project.files = {}; }
    try { project.metadata = JSON.parse(project.metadata || '{}'); } catch { project.metadata = {}; }

    return res.json({ project });
  }

  // PUT /api/projects/:id — update project
  if (req.method === 'PUT') {
    // Verify ownership
    const [existing] = await sql`
      SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${payload.userId}
    `;
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, files, metadata } = req.body ?? {};

    if (!name && !files && !metadata) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const filesJson = files !== undefined ? (typeof files === 'string' ? files : JSON.stringify(files)) : null;
    const metaJson = metadata !== undefined ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

    if (filesJson && metaJson) {
      await sql`UPDATE projects SET name = COALESCE(${name}, name), files = ${filesJson}, metadata = ${metaJson}, updated_at = NOW() WHERE id = ${projectId}`;
    } else if (filesJson) {
      await sql`UPDATE projects SET name = COALESCE(${name}, name), files = ${filesJson}, updated_at = NOW() WHERE id = ${projectId}`;
    } else if (metaJson) {
      await sql`UPDATE projects SET metadata = ${metaJson}, updated_at = NOW() WHERE id = ${projectId}`;
    } else if (name) {
      await sql`UPDATE projects SET name = ${name}, updated_at = NOW() WHERE id = ${projectId}`;
    }

    return res.json({ success: true });
  }

  // DELETE /api/projects/:id — delete project
  if (req.method === 'DELETE') {
    const result = await sql`
      DELETE FROM projects WHERE id = ${projectId} AND user_id = ${payload.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
