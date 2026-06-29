const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const { MCP_TOOLS, executeTool } = require('../mcp/index');

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
// userId now arrives per tool-call as a tool argument (see mcp/index.js,
// where every tool's schema requires it), not as a per-connection header —
// so this no longer needs a userId parameter.
function createMcpServer() {
  const server = new McpServer({
    name: 'repomind-github-tools',
    version: '1.0.0',
  });

  for (const toolDef of MCP_TOOLS) {
    const { name, description, parameters } = toolDef.function;
    const zodShape = buildZodShape(parameters);

    server.tool(name, description, zodShape, async (args) => {
      const { userId, ...toolArgs } = args;
      console.log(`🔧 [MCP] Agent calling tool: ${name}`, toolArgs, 'for user', userId);
      const result = await executeTool(name, toolArgs, userId);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    });
  }

  return server;
}

// ─── Stateless Streamable HTTP endpoint ─────────────────────────────────
// Stateless because each Foundry tool call is independent — no need to
// track sessions across requests. No auth gate here: the MCP connection
// itself is configured as "Unauthenticated" in the Foundry portal, and
// per-user identity is carried inside each tool call's arguments instead.
router.post('/', async (req, res) => {
  console.log('📨 [MCP] Raw incoming request:', JSON.stringify(req.body, null, 2));
  console.log('📨 [MCP] Incoming headers:', JSON.stringify(req.headers, null, 2));
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

// MCP clients may probe with GET; stateless servers don't support server push.
router.get('/', (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed in stateless mode.' },
    id: null,
  });
});

module.exports = router;