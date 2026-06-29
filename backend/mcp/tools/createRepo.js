const { getOctokitForUser } = require('../github-client');

async function createRepo(userId, args) {
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

  if (!args.name) {
    return { error: true, message: '❌ Please provide a repository name.' };
  }

  try {
    const { data } = await octokit.rest.repos.createForAuthenticatedUser({
      name: args.name,
      description: args.description || '',
      private: args.private || false,
      auto_init: true, // creates with README
    });

    return {
      error: false,
      repo: {
        name: data.name,
        fullName: data.full_name,
        private: data.private,
        url: data.html_url,
        cloneUrl: data.clone_url,
        createdAt: new Date(data.created_at).toLocaleDateString(),
      },
    };
  } catch (err) {
    if (err.status === 422) {
      return {
        error: true,
        message: `❌ Repository name already exists or is invalid. Please choose a different name.`,
      };
    }
    if (err.status === 403) {
      return {
        error: true,
        message: `❌ Permission denied. To create repositories, your GitHub OAuth needs the **repo** scope.\n\nTo fix:\n1. Go to Dashboard\n2. Disconnect GitHub\n3. Reconnect — it will ask for the correct permissions.`,
      };
    }
    return { error: true, message: `Failed to create repository: ${err.message}` };
  }
}

module.exports = { createRepo };