const { Octokit } = require('octokit');
const { getCosmosClient } = require('../config/cosmos');

async function getOctokitForUser(userId) {
  if (!userId) return null; // ← explicit guard

  const { githubContainer } = await getCosmosClient();
  const { resources } = await githubContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();

  if (resources.length === 0) return null;
  return new Octokit({ auth: resources[0].accessToken });
}

module.exports = { getOctokitForUser };
// getMostRecentGithubUser is intentionally removed — it leaked cross-user data