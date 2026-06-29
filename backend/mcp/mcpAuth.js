const jwt = require('jsonwebtoken');

// Must match the secret used when signing the token in routes/chat.js
const MCP_AUTH_SECRET = process.env.MCP_AUTH_SECRET;

function verifyMcpAuthHeader(authHeaderValue) {
  if (!authHeaderValue) {
    throw new Error('Missing MCP auth header');
  }

  const token = authHeaderValue.startsWith('Bearer ')
    ? authHeaderValue.slice('Bearer '.length)
    : authHeaderValue;

  const decoded = jwt.verify(token, MCP_AUTH_SECRET);

  if (!decoded.userId) {
    throw new Error('Token missing userId claim');
  }

  return decoded.userId;
}

module.exports = { verifyMcpAuthHeader };