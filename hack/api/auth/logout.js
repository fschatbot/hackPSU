const { authenticate } = require('../_lib/auth');

// JWT logout is client-side (delete the token).
// This endpoint exists so the frontend can call it without errors.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = authenticate(req);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  return res.json({ success: true, message: 'Logged out successfully' });
};
