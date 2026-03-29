/**
 * Local dev server — routes /api/* to Vercel-style handlers,
 * proxies everything else to the CRA dev server (npm start on port 3000).
 *
 * Usage: node server.js
 * CRA dev server must be running separately: npm start
 */

require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3001;
const CRA_PORT = 3000;

// Parse JSON bodies for API routes
app.use(express.json());

// --- API routes ---
// Map each handler file to its URL path
const apiRoutes = [
  { path: '/api/auth/login',    handler: './api/auth/login.js' },
  { path: '/api/auth/register', handler: './api/auth/register.js' },
  { path: '/api/auth/logout',   handler: './api/auth/logout.js' },
  { path: '/api/auth/me',       handler: './api/auth/me.js' },
];

for (const { path: routePath, handler } of apiRoutes) {
  const fn = require(handler);
  app.all(routePath, fn);
}

// --- Proxy everything else to CRA dev server ---
app.use(
  '/',
  createProxyMiddleware({
    target: `http://localhost:${CRA_PORT}`,
    changeOrigin: true,
    ws: true, // proxy websockets (HMR)
  })
);

app.listen(PORT, () => {
  console.log(`\nLocal dev server running at http://localhost:${PORT}`);
  console.log(`API routes handled locally, React proxied to :${CRA_PORT}`);
  console.log(`\nMake sure CRA is running: npm start\n`);
});
