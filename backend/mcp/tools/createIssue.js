const { getOctokitForUser } = require('../github-client');

async function createIssue(userId, args) {
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
  if (!args.title) {
    return { error: true, message: '❌ Please provide an issue title.' };
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

    const { data } = await octokit.rest.issues.create({
      owner: repoOwner,
      repo,
      title: args.title,
      body: args.body || '',
      labels: args.labels || [],
    });

    return {
      error: false,
      issue: {
        number: data.number,
        title: data.title,
        state: data.state,
        url: data.html_url,
        createdAt: new Date(data.created_at).toLocaleDateString(),
      },
    };
  } catch (err) {
    if (err.status === 404) {
      return {
        error: true,
        message: `❌ Repository not found. Check the name and make sure you have access.`,
      };
    }
    if (err.status === 403) {
      return {
        error: true,
        message: `❌ Permission denied. To create issues, your GitHub OAuth needs the **repo** scope.\n\nTo fix:\n1. Go to Dashboard\n2. Disconnect GitHub\n3. Reconnect — it will ask for the correct permissions.`,
      };
    }
    return { error: true, message: `Failed to create issue: ${err.message}` };
  }
}

module.exports = { createIssue };