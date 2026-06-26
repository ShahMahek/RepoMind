const express = require('express');
const bcrypt = require('bcryptjs');
const { getCosmosClient } = require('../config/cosmos');
const { signToken } = require('../utils/jwt');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validations
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const { usersContainer } = await getCosmosClient();

    // Check username taken
    const { resources: existingUsername } = await usersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.username = @username',
        parameters: [{ name: '@username', value: username.toLowerCase() }],
      })
      .fetchAll();

    if (existingUsername.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    // Check email taken
    const { resources: existingEmail } = await usersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email.toLowerCase() }],
      })
      .fetchAll();

    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = require('crypto').randomUUID();

    const user = {
      id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await usersContainer.items.create(user);

    const token = signToken({ userId, username: user.username });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { userId, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    const { usersContainer } = await getCosmosClient();

    // Check if identifier is email or username
    const isEmail = identifier.includes('@');

    const { resources } = await usersContainer.items
      .query({
        query: isEmail
          ? 'SELECT * FROM c WHERE c.email = @identifier'
          : 'SELECT * FROM c WHERE c.username = @identifier',
        parameters: [{ name: '@identifier', value: identifier.toLowerCase() }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const user = resources[0];
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const token = signToken({ userId: user.id, username: user.username });

    res.json({
      message: 'Login successful!',
      token,
      user: { userId: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});
// ─── POST /api/auth/logout ────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { verifyToken } = require('../utils/jwt');
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        const { githubContainer } = await getCosmosClient();
        const docId = `gh_${decoded.userId}`;
        try {
          await githubContainer.item(docId, decoded.userId).delete();
        } catch (e) {
          // Already disconnected, fine
        }
      } catch (e) {
        // Invalid token, fine
      }
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed.' });
  }
});
module.exports = router;