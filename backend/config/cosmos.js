const { CosmosClient } = require('@azure/cosmos');

let usersContainer;
let githubContainer;
let chatContainer;
let sessionsContainer;

async function getCosmosClient() {
  if (usersContainer && githubContainer && chatContainer && sessionsContainer) {
    return { usersContainer, githubContainer, chatContainer, sessionsContainer };
  }

  const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
  });

  const { database } = await client.databases.createIfNotExists({
    id: process.env.COSMOS_DATABASE || 'repomind',
  });

  const { container: uc } = await database.containers.createIfNotExists({
    id: 'users',
    partitionKey: { paths: ['/id'] },
  });
  usersContainer = uc;

 const { container: gc } = await database.containers.createIfNotExists({
    id: 'github_connections',
    partitionKey: { paths: ['/id'] },
  });
  githubContainer = gc;

  const { container: cc } = await database.containers.createIfNotExists({
    id: 'chat_sessions',
    partitionKey: { paths: ['/userId'] },
  });
  chatContainer = cc;

  const { container: sc } = await database.containers.createIfNotExists({
    id: 'sessions',
    partitionKey: { paths: ['/userId'] },
  });
  sessionsContainer = sc;

  console.log('✅ Cosmos DB connected — 4 containers ready');
  return { usersContainer, githubContainer, chatContainer, sessionsContainer };
}

module.exports = { getCosmosClient };