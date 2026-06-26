const { getOctokitForUser } = require('../github-client');

async function listIssues(userId, args) {
  const octokit = await getOctokitForUser(userId);

  if (!octokit) {
    return {
      error: true,
      message: '❌ GitHub is not connected. Please connect your GitHub account from the dashboard first.',
    };
  }

  if (!args.repo) {
    return { error: true, message: '❌ Please provide a repository name.' };
  }

  try {
    const [owner, repo] = args.repo.includes('/')
      ? args.repo.split('/')
      : [null, args.repo];

    // Get authenticated user if owner not provided
    let repoOwner = owner;
    if (!repoOwner) {
      const { data: user } = await octokit.rest.users.getAuthenticated();
      repoOwner = user.login;
    }

    const { data } = await octokit.rest.issues.listForRepo({
      owner: repoOwner,
      repo,
      state: args.state || 'open',
      per_page: 20,
    });

    // Filter out pull requests (GitHub API returns PRs as issues too)
    const issues = data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user.login,
        labels: issue.labels.map((l) => l.name).join(', ') || 'none',
        createdAt: new Date(issue.created_at).toLocaleDateString(),
        url: issue.html_url,
      }));

    if (issues.length === 0) {
      return { 
        error: false, 
        message: `No ${args.state || 'open'} issues found in ${repoOwner}/${repo}.` 
      };
    }

    return { error: false, issues, repo: `${repoOwner}/${repo}` };
  } catch (err) {
    if (err.status === 404) {
      return {
        error: true,
        message: `❌ Repository not found. Check the name and make sure you have access to it.`,
      };
    }
    if (err.status === 403) {
      return {
        error: true,
        message: `❌ Permission denied. To view issues, your GitHub OAuth needs the **repo** scope.\n\nTo fix: Dashboard → Disconnect GitHub → Reconnect (it will ask for permissions again).`,
      };
    }
    return { error: true, message: `Failed to fetch issues: ${err.message}` };
  }
}

module.exports = { listIssues };