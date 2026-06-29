const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const { MCP_TOOLS, executeTool } = require('../mcp/index');
const { authMiddleware } = require('../middleware/auth'); // ← add this

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

// ← Accept userId as a parameter, bind it into every tool
function createMcpServer(userId) {
  const server = new McpServer({
    name: 'repomind-github-tools',
    version: '1.0.0',
  });

  for (const toolDef of MCP_TOOLS) {
    const { name, description, parameters } = toolDef.function;
    
    // Remove userId from the schema — agent no longer needs to supply it
    const filteredParameters = {
      ...parameters,
      properties: Object.fromEntries(
        Object.entries(parameters?.properties || {}).filter(([k]) => k !== 'userId')
      ),
      required: (parameters?.required || []).filter(k => k !== 'userId'),
    };
    const zodShape = buildZodShape(filteredParameters);

    server.tool(name, description, zodShape, async (args) => {
      console.log(`🔧 [MCP] Agent calling tool: ${name}`, args, 'for user', userId);
      const result = await executeTool(name, args, userId); // ← userId injected here
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    });
  }

  return server;
}

// ← Apply authMiddleware so req.user is populated
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized: no userId on request' },
        id: null,
      });
    }

    const server = createMcpServer(userId); // ← pass userId into server
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