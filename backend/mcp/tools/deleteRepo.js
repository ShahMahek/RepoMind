const { getOctokitForUser } = require('../github-client');

async function deleteRepo(userId, args) {
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
      message: '❌ GitHub is not connected. Please connect your GitHub account first.',
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

    await octokit.rest.repos.delete({
      owner: repoOwner,
      repo,
    });

    return {
      error: false,
      message: `✅ Repository ${repoOwner}/${repo} deleted successfully.`,
    };
  } catch (err) {
    if (err.status === 403) {
      return {
        error: true,
        message: `❌ Permission denied. Make sure you selected the **delete_repo** scope when generating your token.\n\nTo fix: Disconnect GitHub → regenerate token with delete_repo scope → reconnect.`,
      };
    }
    if (err.status === 404) {
      return {
        error: true,
        message: `❌ Repository not found. Check the name and try again.`,
      };
    }
    return { error: true, message: `Failed to delete repository: ${err.message}` };
  }
}

module.exports = { deleteRepo };