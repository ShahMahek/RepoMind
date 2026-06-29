const { Octokit } = require('octokit');
const { getCosmosClient } = require('../config/cosmos');

async function getOctokitForUser(userId) {
  const { githubContainer } = await getCosmosClient();

  const { resources } = await githubContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();

  if (resources.length === 0) {
    return null;
  }

  return new Octokit({ auth: resources[0].accessToken });
}

// Temporary fallback for when the agent doesn't reliably forward userId.
// Returns the userId of whatever GitHub connection exists in Cosmos right now.
// Only safe while there's a single connected user — revisit before multi-user use.
async function getMostRecentGithubUser() {
  const { githubContainer } = await getCosmosClient();

  const { resources } = await githubContainer.items
    .query({ query: 'SELECT * FROM c OFFSET 0 LIMIT 1' })
    .fetchAll();

  return resources.length > 0 ? resources[0].userId : null;
}

module.exports = { getOctokitForUser, getMostRecentGithubUser };