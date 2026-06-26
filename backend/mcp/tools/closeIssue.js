const { getOctokitForUser } = require('../github-client');

async function closeIssue(userId, args) {
  const octokit = await getOctokitForUser(userId);

  if (!octokit) {
    return {
      error: true,
      message: '❌ GitHub is not connected. Please connect your GitHub account first.',
    };
  }

  if (!args.repo) return { error: true, message: '❌ Please provide a repository name.' };
  if (!args.issue_number) return { error: true, message: '❌ Please provide an issue number.' };

  try {
    const [owner, repo] = args.repo.includes('/')
      ? args.repo.split('/')
      : [null, args.repo];

    let repoOwner = owner;
    if (!repoOwner) {
      const { data: user } = await octokit.rest.users.getAuthenticated();
      repoOwner = user.login;
    }

    const { data } = await octokit.rest.issues.update({
      owner: repoOwner,
      repo,
      issue_number: parseInt(args.issue_number),
      state: 'closed',
    });

    return {
      error: false,
      issue: {
        number: data.number,
        title: data.title,
        state: data.state,
        url: data.html_url,
      },
    };
  } catch (err) {
    if (err.status === 404) {
      return { error: true, message: `❌ Repository or issue not found.` };
    }
    if (err.status === 403) {
      return { error: true, message: `❌ Permission denied. Make sure your token has repo scope.` };
    }
    return { error: true, message: `Failed to close issue: ${err.message}` };
  }
}

module.exports = { closeIssue };