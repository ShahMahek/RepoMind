if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');

const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const chatRoutes = require('./routes/chat');
const sessionsRoutes = require('./routes/sessions');
const chatHistoryRoutes = require('./routes/chatHistory');

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
app.use('/api/chat', chatHistoryRoutes);
app.use('/api/sessions', sessionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RepoMind API', timestamp: new Date() });
});

// ─── Serve Next.js in production ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  const nextDir = path.join(__dirname, '../frontend/.next/standalone');
  const staticDir = path.join(__dirname, '../frontend/.next/static');
  const publicDir = path.join(__dirname, '../frontend/public');

  app.use('/_next/static', express.static(staticDir));
  app.use('/public', express.static(publicDir));

  // Serve standalone Next.js for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(nextDir, 'public', 'index.html'), (err) => {
      if (err) res.sendFile(path.join(publicDir, '404.html'), () => res.status(404).end());
    });
  });
}

app.listen(PORT, () => {
  console.log(`\n🌿 RepoMind API running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;