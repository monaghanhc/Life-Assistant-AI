import "server-only";

interface PublicRuntimeConfig {
  hasOpenAiKey: boolean;
  openAiModel: string;
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  return {
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    openAiModel: process.env.OPENAI_MODEL?.trim() || "gpt-5.2",
  };
}

export function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.2",
  };
}
