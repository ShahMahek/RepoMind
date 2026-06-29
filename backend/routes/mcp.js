const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const { MCP_TOOLS, executeTool } = require('../mcp/index');

const router = express.Router();

function jsonSchemaPropToZod(propSchema) {
  let zodType;
  switch (propSchema.type) {
    case 'string': zodType = propSchema.enum ? z.enum(propSchema.enum) : z.string(); break;
    case 'number': zodType = z.number(); break;
    case 'boolean': zodType = z.boolean(); break;
    case 'array': zodType = z.array(z.string()); break;
    default: zodType = z.any();
  }
  if (propSchema.description) zodType = zodType.describe(propSchema.description);
  return zodType;
}

function buildZodShape(parameters) {
  const shape = {};
  const required = new Set(parameters?.required || []);
  for (const [key, propSchema] of Object.entries(parameters?.properties || {})) {
    let zodType = jsonSchemaPropToZod(propSchema);
    if (!required.has(key)) zodType = zodType.optional();
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

    const filteredParameters = {
      ...parameters,
      properties: Object.fromEntries(
        Object.entries(parameters?.properties || {}).filter(([k]) => k !== 'userId')
      ),
      required: (parameters?.required || []).filter(k => k !== 'userId'),
    };
    const zodShape = buildZodShape(filteredParameters);

    server.tool(name, description, zodShape, async (args) => {
      // userId comes from the agent passing it as a tool argument
      const userId = args.userId || null;
      if (!userId) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: true, message: 'userId missing.' }),
          }],
        };
      }
      console.log(`🔧 [MCP] Agent calling tool: ${name}`, args, 'for user', userId);
      const result = await executeTool(name, args, userId);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    });
  }

  return server;
}

router.post('/', async (req, res) => {
  try {
    // Validate shared secret from Foundry agent
    const secret = req.headers['x-mcp-secret'];
    if (secret !== process.env.MCP_AUTH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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