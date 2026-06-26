const { AzureOpenAI } = require('openai');

let openaiClient;

function getAzureOpenAIClient() {
  if (openaiClient) return openaiClient;

  openaiClient = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-11-21',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
  });

  console.log('✅ Azure OpenAI client ready');
  console.log('   Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
  console.log('   Deployment:', process.env.AZURE_OPENAI_DEPLOYMENT);
  console.log('   API Version:', process.env.AZURE_OPENAI_API_VERSION);
  return openaiClient;
}

module.exports = { getAzureOpenAIClient };