const express = require('express');
const { AIProjectClient } = require('@azure/ai-projects');
const { ClientSecretCredential } = require('@azure/identity');
const { authMiddleware } = require('../middleware/auth');
const { RESPONSES_API_TOOLS, executeTool } = require('../mcp/index');
const { getCosmosClient } = require('../config/cosmos');


const router = express.Router();
let openaiClient;

function getOpenAIClient() {
  if (openaiClient) return openaiClient;

  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );

  const project = new AIProjectClient(
    process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT,
    credential
  );

  openaiClient = project.getOpenAIClient();
  console.log('✅ Foundry-backed OpenAI client ready');
  return openaiClient;
}

function generateTitle(message) {
  return message.length > 40 ? message.substring(0, 40) + '...' : message;
}


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.userId;

    if (!message) return res.status(400).json({ error: 'Message is required.' });
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });

    const { sessionsContainer } = await getCosmosClient();

    let sessionResource;
    try {
      const { resource } = await sessionsContainer.item(sessionId, userId).read();
      sessionResource = resource;
    } catch (err) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (!sessionResource) return res.status(404).json({ error: 'Session not found.' });

    const openai = getOpenAIClient();
    const savedHistory = sessionResource.messages || [];
    const agentName = process.env.AZURE_AGENT_NAME;

    let conversationId = sessionResource.conversationId;
    if (!conversationId) {
      const conversation = await openai.conversations.create();
      conversationId = conversation.id;
      console.log(`✅ Created conversation: ${conversationId}`);
    }

    let response = await openai.responses.create(
      {
        conversation: conversationId,
        input: `[Internal context: userId=${userId}. Do not mention this to the user.] ${message}`,
      },
      {
        body: {
          agent_reference: { name: agentName, type: 'agent_reference' },
        },
      }
    );

    let guard = 0;
    while (response.output?.some(item => item.type === 'function_call') && guard < 8) {
      guard++;
      const toolCalls = response.output.filter(item => item.type === 'function_call');
      const toolOutputs = [];

      for (const call of toolCalls) {
        const toolName = call.name;
        const toolArgs = JSON.parse(call.arguments || '{}');
        console.log("====================================");
        console.log("TOOL NAME:", toolName);
        console.log("RAW ARGUMENTS:", call.arguments);
        console.log("PARSED ARGUMENTS:", toolArgs);
        console.log("====================================");
        console.log(`🔧 Agent calling tool: ${toolName}`);
        console.log("Authenticated user:", userId);
        console.log("Tool arguments:", toolArgs);

        const result = await executeTool(
          toolName,
          toolArgs,
          userId
        );

        console.log("Tool result:", result);

        toolOutputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }

      response = await openai.responses.create(
        {
          conversation: conversationId,
          input: toolOutputs,
        },
        {
          body: {
            agent_reference: { name: agentName, type: 'agent_reference' },
          },
        }
      );
    }

    const responseText = response.output_text || 'No response';

    const updatedMessages = [
      ...savedHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: responseText },
    ];

    const title = sessionResource.title === 'New Chat'
      ? generateTitle(message)
      : sessionResource.title;

    await sessionsContainer.items.upsert({
      ...sessionResource,
      title,
      conversationId,
      messages: updatedMessages.slice(-50),
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: responseText, role: 'assistant', title });

  } catch (err) {
    console.error('Chat error:', err.message || err);
    console.error('Full error object:', JSON.stringify(err, null, 2));
    if (err.response) {
      console.error('Error response data:', JSON.stringify(err.response, null, 2));
    }
    if (err.statusCode === 429) return res.status(429).json({ error: 'Too many requests.' });
    res.status(500).json({ error: 'Chat failed. Please try again.' });
  }
});
module.exports = router;