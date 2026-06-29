const { AzureOpenAI } = require('openai');

let openaiClient;

function getAzureOpenAIClient() {
  if (openaiClient) return openaiClient;

  openaiClient = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-11-20',
  });

  return openaiClient;
}

module.exports = { getAzureOpenAIClient };