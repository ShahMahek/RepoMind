const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'repomind_fallback_secret';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };