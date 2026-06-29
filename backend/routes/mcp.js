const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const { MCP_TOOLS, executeTool } = require('../mcp/index');
const { verifyMcpAuthHeader } = require('../mcp/mcpAuth');

const router = express.Router();

// ─── Convert your existing JSON-schema tool defs into Zod shapes ───────
// McpServer's .tool() wants a Zod raw shape object, not a JSON schema.
// We do a light manual mapping here since your parameter schemas are simple
// (string / number / boolean / array / enum) — this keeps things explicit
// rather than pulling in a generic json-schema-to-zod conversion dependency.
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
      zodType = z.array(z.string()); // all current array params are string arrays (labels)
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

// ─── Build a fresh McpServer instance with all tools registered ────────
function createMcpServer(userId) {
  const server = new McpServer({
    name: 'repomind-github-tools',
    version: '1.0.0',
  });

  for (const toolDef of MCP_TOOLS) {
    const { name, description, parameters } = toolDef.function;
    const zodShape = buildZodShape(parameters);

    server.tool(name, description, zodShape, async (args) => {
      console.log(`🔧 [MCP] Agent calling tool: ${name}`, args);
      const result = await executeTool(name, args, userId);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    });
  }

  return server;
}

// ─── Stateless Streamable HTTP endpoint ─────────────────────────────────
// Stateless because each Foundry tool call is independent — no need to
// track sessions across requests.
router.post('/', async (req, res) => {
  let userId;
  try {
    userId = verifyMcpAuthHeader(req.headers['authorization']);
  } catch (err) {
    console.error('MCP auth error:', err.message);
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: ' + err.message },
      id: null,
    });
  }

  try {
    const server = createMcpServer(userId);
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

// MCP clients may probe with GET; stateless servers don't support server push.
router.get('/', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed in stateless mode.' },
    id: null,
  });
});

module.exports = router;