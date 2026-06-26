const express = require('express');
const axios = require('axios');
const { getCosmosClient } = require('../config/cosmos');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── POST /api/github/connect ─────────────────────────────
// User pastes their PAT token
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || (!token.startsWith('ghp_') && !token.startsWith('github_pat_'))) {
      return res.status(400).json({
        error: 'Invalid token format. Token should start with ghp_ or github_pat_'
      });
    }
 console.log('Attempting to connect with token:', token.substring(0, 10) + '...');
    // Verify token works by calling GitHub API
    let githubUser;
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'RepoMind-App',
        },
      });
      githubUser = response.data;
    } catch (err) {
      if (err.response?.status === 401) {
        return res.status(401).json({
          error: 'Token is invalid or expired. Please generate a new token from GitHub.'
        });
      }
      return res.status(400).json({
        error: 'Could not verify token with GitHub. Please try again.'
      });
    }

    const { githubContainer } = await getCosmosClient();

    // Save/update connection
    const connection = {
      id: `gh_${req.user.userId}`,
      userId: req.user.userId,
      accessToken: token,
      githubUsername: githubUser.login,
      githubAvatarUrl: githubUser.avatar_url,
      githubProfileUrl: githubUser.html_url,
      connectedAt: new Date().toISOString(),
    };
     console.log('Saving connection for userId:', req.user.userId, 'id:', connection.id);

    const result = await githubContainer.items.upsert(connection);
    console.log('Saved connection:', result.resource?.id);


    res.json({
      message: 'GitHub connected successfully!',
      githubUsername: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      profileUrl: githubUser.html_url,
    });
  } catch (err) {
    console.error('GitHub connect error:', err);
    res.status(500).json({ error: 'Failed to connect GitHub. Please try again.' });
  }
});

// ─── GET /api/github/status ───────────────────────────────
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const { githubContainer } = await getCosmosClient();

    const { resources } = await githubContainer.items
  .query({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: `gh_${req.user.userId}` }],
  }, { enableCrossPartitionQuery: true })
  .fetchAll({ enableCrossPartitionQuery: true });

    if (resources.length === 0) {
      return res.json({ connected: false });
    }

    const conn = resources[0];

    // Verify token is still valid
    try {
      await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${conn.accessToken}`,
          'User-Agent': 'RepoMind-App',
        },
      });
    } catch (err) {
      if (err.response?.status === 401) {
        return res.json({
          connected: false,
          tokenExpired: true,
          message: 'Your GitHub token has expired or been deleted. Please reconnect.'
        });
      }
    }

    res.json({
      connected: true,
      githubUsername: conn.githubUsername,
      avatarUrl: conn.githubAvatarUrl,
      profileUrl: conn.githubProfileUrl,
      connectedAt: conn.connectedAt,
    });
  } catch (err) {
    console.error('GitHub status error:', err);
    res.status(500).json({ error: 'Failed to check GitHub status.' });
  }
});

// ─── DELETE /api/github/disconnect ───────────────────────
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    const { githubContainer } = await getCosmosClient();
    const docId = `gh_${req.user.userId}`;
    try {
      await githubContainer.item(docId, req.user.userId).delete();
    } catch (e) {}
    res.json({ message: 'GitHub disconnected successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect GitHub.' });
  }
});

// ─── GET /api/github/token ────────────────────────────────
// Returns masked token if exists so frontend can prefill
// ─── GET /api/github/token ────────────────────────────────
router.get('/token', authMiddleware, async (req, res) => {
  try {
    const { githubContainer } = await getCosmosClient();

    const { resources } = await githubContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: req.user.userId }],
      })
      .fetchAll({ enableCrossPartitionQuery: true });

    console.log('Token query result:', resources.length, 'userId:', req.user.userId);

    if (resources.length === 0) {
      return res.json({ hasToken: false });
    }

    res.json({
      hasToken: true,
      token: resources[0].accessToken,
    });
  } catch (err) {
    console.error('Get token error:', err);
    res.status(500).json({ error: 'Failed to get token.' });
  }
});

module.exports = router;