const { getOctokitForUser } = require('../github-client');

async function listPRs(userId, args) {
  const octokit = await getOctokitForUser(userId);
  if (!octokit) {
  return {
    error: true,
    message: '❌ GitHub is not connected. Please connect your GitHub account from the dashboard first.',
  };
}

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

    let repoOwner = owner;
    if (!repoOwner) {
      const { data: user } = await octokit.rest.users.getAuthenticated();
      repoOwner = user.login;
    }

    const { data } = await octokit.rest.pulls.list({
      owner: repoOwner,
      repo,
      state: args.state || 'open',
      per_page: 20,
    });

    if (data.length === 0) {
      return {
        error: false,
        message: `No ${args.state || 'open'} pull requests found in ${repoOwner}/${repo}.`,
      };
    }

    const prs = data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user.login,
      from: pr.head.ref,
      into: pr.base.ref,
      merged: pr.merged_at ? `Merged on ${new Date(pr.merged_at).toLocaleDateString()}` : 'Not merged',
      createdAt: new Date(pr.created_at).toLocaleDateString(),
      url: pr.html_url,
    }));

    return { error: false, prs, repo: `${repoOwner}/${repo}` };
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
        message: `❌ Permission denied. To view PRs, your GitHub OAuth needs the **repo** scope.\n\nTo fix: Dashboard → Disconnect GitHub → Reconnect.`,
      };
    }
    return { error: true, message: `Failed to fetch pull requests: ${err.message}` };
  }
}

module.exports = { listPRs };