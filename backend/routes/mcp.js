const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const { MCP_TOOLS, executeTool } = require('../mcp/index');
const { getMostRecentGithubUser } = require('../mcp/github-client');

const router = express.Router();

console.log('🆕 [MCP] routes/mcp.js loaded — VERSION MARKER v3-debug');

function jsonSchemaPropToZod(propSchema) {
  let zodType;

  switch (propSchema.type) {
    case 'string':
      zodType = propSchema.enum ? z.enum(propSchema.enum) : z.string();
      break;
    case 'number':
      zodType = z.number();
      break;
    case 'boolean':
      zodType = z.boolean();
      break;
    case 'array':
      zodType = z.array(z.string());
      break;
    default:
      zodType = z.any();
  }

  if (propSchema.description) {
    zodType = zodType.describe(propSchema.description);
  }

  return zodType;
}

function buildZodShape(parameters) {
  const shape = {};
  const required = new Set(parameters?.required || []);

  for (const [key, propSchema] of Object.entries(parameters?.properties || {})) {
    let zodType = jsonSchemaPropToZod(propSchema);
    if (!required.has(key)) {
      zodType = zodType.optional();
    }
    shape[key] = zodType;
  }

  return shape;
}

function createMcpServer() {
  const server = new McpServer({
    name: 'repomind-github-tools',
    version: '1.0.0',
  });

  for (const toolDef of MCP_TOOLS) {
    const { name, description, parameters } = toolDef.function;
    const zodShape = buildZodShape(parameters);

    server.tool(name, description, zodShape, async (args) => {
  console.log('🆕 [MCP] v3-debug handler entered for tool:', name);
  console.log('🆕 [MCP] FULL args object:', JSON.stringify(args));

  let userId = args && args.userId ? args.userId : null;
  const toolArgs = { ...args };
  delete toolArgs.userId;

  if (!userId) {
    userId = await getMostRecentGithubUser();
    console.log('🆕 [MCP] userId missing from model, fell back to:', userId);
  }

  console.log('🆕 [MCP] final userId:', userId);
  console.log('🆕 [MCP] remaining toolArgs:', JSON.stringify(toolArgs));

  const result = await executeTool(name, toolArgs, userId);

  console.log('🆕 [MCP] executeTool result:', JSON.stringify(result));

  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});
  }

  return server;
}

router.post('/', async (req, res) => {
  console.log('🆕 [MCP] v3-debug POST received, method:', req.body?.method);

  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

router.get('/', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed in stateless mode.' },
    id: null,
  });
});

module.exports = router;