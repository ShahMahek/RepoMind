if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const chatRoutes = require('./routes/chat');
const sessionsRoutes = require('./routes/sessions');
const mcpRoutes = require('./routes/mcp');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/mcp', mcpRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RepoMind API', timestamp: new Date() });
});

// ─── Serve Next.js in production ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  const { createProxyMiddleware } = require('http-proxy-middleware');
  const staticDir = path.join(__dirname, '../frontend/.next/static');
  const publicDir = path.join(__dirname, '../frontend/public');
  const standaloneServer = path.join(__dirname, '../frontend/.next/standalone/server.js');

  // Start Next.js standalone as a child process on port 3000
  const nextProcess = spawn('node', [standaloneServer], {
    env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
    stdio: 'inherit',
  });

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js process:', err);
  });

  process.on('exit', () => nextProcess.kill());

  // Serve static assets directly (faster than proxying)
  app.use('/_next/static', express.static(staticDir));
  app.use('/public', express.static(publicDir));

  // Proxy all non-API requests to Next.js
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({ error: 'Frontend not ready yet, try again in a moment.' });
      },
    },
    pathFilter: (path) => !path.startsWith('/api'),
  }));
}

app.listen(PORT, () => {
  console.log(`\n🌿 RepoMind API running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`   Frontend: proxying from Next.js standalone on port 3000`);
  }
});

module.exports = app;