const express = require('express');
const { getCosmosClient } = require('../config/cosmos');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const SESSION_EXPIRY_HOURS = 24;

// ─── Helper: check if session expired ─────────────────────
function isExpired(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - created) / (1000 * 60 * 60);
  return diffHours > SESSION_EXPIRY_HOURS;
}

// ─── GET /api/sessions ────────────────────────────────────
// Get all sessions for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { sessionsContainer } = await getCosmosClient();

    const { resources } = await sessionsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC',
        parameters: [{ name: '@userId', value: req.user.userId }],
      })
      .fetchAll();

    // Filter out expired sessions
    const activeSessions = resources.filter(s => !isExpired(s.createdAt));

    // Delete expired ones
    const expiredSessions = resources.filter(s => isExpired(s.createdAt));
    for (const s of expiredSessions) {
      try {
        await sessionsContainer.item(s.id, s.userId).delete();
      } catch (e) {}
    }

    res.json({ sessions: activeSessions.map(s => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages?.length || 0,
    }))});
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to load sessions.' });
  }
});

// ─── POST /api/sessions ───────────────────────────────────
// Create new session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionsContainer } = await getCosmosClient();
    const sessionId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    const session = {
      id: sessionId,
      userId: req.user.userId,
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    await sessionsContainer.items.create(session);

    res.status(201).json({ session });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session.' });
  }
});

// ─── GET /api/sessions/:sessionId ────────────────────────
// Get single session with messages
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionsContainer } = await getCosmosClient();

    const { resource } = await sessionsContainer
      .item(req.params.sessionId, req.user.userId)
      .read();

    if (!resource) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (isExpired(resource.createdAt)) {
      return res.status(410).json({ error: 'Session expired.' });
    }

    res.json({ session: resource });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to load session.' });
  }
});

// ─── DELETE /api/sessions/:sessionId ─────────────────────
router.delete('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionsContainer } = await getCosmosClient();
    await sessionsContainer.item(req.params.sessionId, req.user.userId).delete();
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session.' });
  }
});

module.exports = router;