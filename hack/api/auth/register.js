const bcrypt = require('bcryptjs');
const { sql, schemaReady } = require('../_lib/db');
const { generateToken } = require('../_lib/auth');

const SALT_ROUNDS = 10;

module.exports = async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await schemaReady;

  const { email, password, name } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check duplicate email
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

  const [user] = await sql`
    INSERT INTO users (email, password_hash, name, avatar)
    VALUES (${email}, ${passwordHash}, ${name}, ${avatar})
    RETURNING id, email, name, avatar, created_at
  `;

  const token = generateToken(user.id, user.email);

  return res.status(201).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.created_at,
    },
    token,
  });
};
