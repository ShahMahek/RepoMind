const { listRepos } = require('./tools/listRepos');
const { listIssues } = require('./tools/listIssues');
const { listPRs } = require('./tools/listPRs');
const { createRepo } = require('./tools/createRepo');
const { createIssue } = require('./tools/createIssue');
const { closeIssue } = require('./tools/closeIssue');
const { deleteRepo } = require('./tools/deleteRepo');

const USER_ID_PROP = {
  userId: {
    type: 'string',
    description: 'The authenticated user ID. Always pass this from the internal context provided at the start of the message (format: [Internal context: userId=XXXX]).',
  },
};

const MCP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_repos',
      description: 'List all GitHub repositories for the connected user account',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          visibility: {
            type: 'string',
            enum: ['all', 'public', 'private'],
            description: 'Filter repositories by visibility. Defaults to all.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_issues',
      description: 'List issues for a specific GitHub repository',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          repo: {
            type: 'string',
            description: 'Repository name e.g. "my-repo" or "owner/my-repo"',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'Filter issues by state. Defaults to open.',
          },
        },
        required: ['repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_prs',
      description: 'List pull requests for a specific GitHub repository',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          repo: {
            type: 'string',
            description: 'Repository name e.g. "my-repo" or "owner/my-repo"',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'Filter PRs by state. Defaults to open.',
          },
        },
        required: ['repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_repo',
      description: 'Create a new GitHub repository for the authenticated user',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          name: {
            type: 'string',
            description: 'Name of the new repository',
          },
          description: {
            type: 'string',
            description: 'Optional description for the repository',
          },
          private: {
            type: 'boolean',
            description: 'Whether the repository should be private. Defaults to false.',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_issue',
      description: 'Create a new issue in a GitHub repository',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          repo: {
            type: 'string',
            description: 'Repository name e.g. "my-repo" or "owner/my-repo"',
          },
          title: {
            type: 'string',
            description: 'Title of the issue',
          },
          body: {
            type: 'string',
            description: 'Optional body/description of the issue',
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of label names to apply',
          },
        },
        required: ['repo', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_issue',
      description: 'Close an existing issue in a GitHub repository',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          repo: {
            type: 'string',
            description: 'Repository name e.g. "my-repo" or "owner/my-repo"',
          },
          issue_number: {
            type: 'number',
            description: 'The issue number to close',
          },
        },
        required: ['repo', 'issue_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_repo',
      description: 'Delete a GitHub repository permanently',
      parameters: {
        type: 'object',
        properties: {
          ...USER_ID_PROP,
          repo: {
            type: 'string',
            description: 'Repository name e.g. "my-repo" or "owner/my-repo"',
          },
        },
        required: ['repo'],
      },
    },
  },
];

async function executeTool(toolName, args, userId) {
  // userId comes either from args (MCP route) or passed directly (chat.js)
  const resolvedUserId = userId || args.userId || null;
  console.log(`🔧 Executing tool: ${toolName}`, args, 'userId:', resolvedUserId);

  switch (toolName) {
    case 'list_repos':   return await listRepos(resolvedUserId, args);
    case 'list_issues':  return await listIssues(resolvedUserId, args);
    case 'list_prs':     return await listPRs(resolvedUserId, args);
    case 'create_repo':  return await createRepo(resolvedUserId, args);
    case 'delete_repo':  return await deleteRepo(resolvedUserId, args);
    case 'create_issue': return await createIssue(resolvedUserId, args);
    case 'close_issue':  return await closeIssue(resolvedUserId, args);
    default:             return { error: true, message: `Unknown tool: ${toolName}` };
  }
}

const RESPONSES_API_TOOLS = MCP_TOOLS.map(t => ({
  type: t.type,
  name: t.function.name,
  description: t.function.description,
  parameters: t.function.parameters,
}));

module.exports = { MCP_TOOLS, RESPONSES_API_TOOLS, executeTool };