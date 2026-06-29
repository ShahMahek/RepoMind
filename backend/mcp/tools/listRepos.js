const { getOctokitForUser } = require('../github-client');

async function listRepos(userId, args) {
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

  try {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 30,
      visibility: args.visibility || 'all',
    });

    if (data.length === 0) {
      return { error: false, message: 'No repositories found.' };
    }

    const repos = data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || 'No description',
      private: repo.private,
      language: repo.language || 'N/A',
      stars: repo.stargazers_count,
      updatedAt: new Date(repo.updated_at).toLocaleDateString(),
      url: repo.html_url,
    }));

    return { error: false, repos };
  } catch (err) {
    if (err.status === 401) {
      return {
        error: true,
        message: '❌ GitHub token expired or revoked. Please disconnect and reconnect your GitHub account.',
      };
    }
    return { error: true, message: `Failed to fetch repositories: ${err.message}` };
  }
}

module.exports = { listRepos };