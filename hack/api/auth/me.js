const { sql, schemaReady } = require('../_lib/db');
const { authenticate } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = authenticate(req);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  await schemaReady;

  const [user] = await sql`
    SELECT id, email, name, avatar, created_at
    FROM users
    WHERE id = ${payload.userId}
  `;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ success: true, user });
};
