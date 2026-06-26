const express = require('express');
const { getAzureOpenAIClient } = require('../config/azure-ai');
const { authMiddleware } = require('../middleware/auth');
const { MCP_TOOLS, executeTool } = require('../mcp/index');
const { getCosmosClient } = require('../config/cosmos');

const router = express.Router();

// ─── Helper: generate session title from first message ────
function generateTitle(message) {
  return message.length > 40 ? message.substring(0, 40) + '...' : message;
}

// ─── POST /api/chat ───────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const { sessionsContainer } = await getCosmosClient();

    // Load session
    let sessionResource;
    try {
      const { resource } = await sessionsContainer.item(sessionId, userId).read();
      sessionResource = resource;
    } catch (err) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (!sessionResource) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const client = getAzureOpenAIClient();
    const savedHistory = sessionResource.messages || [];

    // Build messages array
    const messages = [
      ...savedHistory.slice(-10),
      { role: 'user', content: message },
    ];

    // ─── First call to GPT-4o ──────────────────────────
    let response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
      messages,
      tools: MCP_TOOLS,
      tool_choice: 'auto',
      max_tokens: 1000,
      temperature: 0.7,
    });

    let assistantMessage = response.choices[0].message;

    // ─── Tool call loop ────────────────────────────────
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const result = await executeTool(toolName, toolArgs, userId);
          return {
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result),
          };
        })
      );

      messages.push(...toolResults);

      response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
        messages,
        tools: MCP_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1500,
        temperature: 0.7,
      });

      assistantMessage = response.choices[0].message;
    }

    // ─── Save updated session ──────────────────────────
    const updatedMessages = [
      ...savedHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage.content },
    ];

    // Update title from first message
    const title = sessionResource.title === 'New Chat'
      ? generateTitle(message)
      : sessionResource.title;

    await sessionsContainer.items.upsert({
      ...sessionResource,
      title,
      messages: updatedMessages.slice(-50),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      message: assistantMessage.content,
      role: 'assistant',
      title,
    });

  } catch (err) {
    console.error('Chat error:', err);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }
    if (err.status === 401) {
      return res.status(401).json({ error: 'Azure OpenAI authentication failed.' });
    }
    res.status(500).json({ error: 'Chat failed. Please try again.' });
  }
});

module.exports = router;