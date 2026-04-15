import "server-only";

import { getPublicRuntimeConfig } from "@/lib/env";
import { generateFallbackAdminPacket } from "@/lib/generate-admin-packet";
import { generateOpenAiAdminPacket } from "@/lib/openai-admin-packet";
import {
  AssistRequest,
  AssistResponsePayload,
  ProviderStatus,
  UserMemory,
} from "@/lib/types";

export async function generateAssistResponse(
  request: AssistRequest,
  memory: UserMemory,
): Promise<AssistResponsePayload> {
  const provider = getInitialProviderStatus();

  if (!provider.hasConfiguredKey) {
    return {
      memory,
      packet: generateFallbackAdminPacket(request, memory),
      provider,
    };
  }

  try {
    const packet = await generateOpenAiAdminPacket(request, memory);
    if (packet) {
      return {
        memory,
        packet,
        provider: {
          ...provider,
          provider: "openai",
          message: `OpenAI Responses API active on ${provider.model}.`,
        },
      };
    }
  } catch (error) {
    console.error("OpenAI packet generation failed:", error);
  }

  return {
    memory,
    packet: generateFallbackAdminPacket(request, memory),
    provider: {
      ...provider,
      provider: "fallback",
      message: `OpenAI is configured, but the live call failed. Using deterministic fallback on ${provider.model}.`,
    },
  };
}

export function getInitialProviderStatus(): ProviderStatus {
  const config = getPublicRuntimeConfig();

  if (config.hasOpenAiKey) {
    return {
      provider: "openai",
      model: config.openAiModel,
      hasConfiguredKey: true,
      message: `OpenAI is configured with ${config.openAiModel}.`,
    };
  }

  return {
    provider: "fallback",
    model: config.openAiModel,
    hasConfiguredKey: false,
    message: `No OPENAI_API_KEY found. Using deterministic fallback until .env.local is populated.`,
  };
}
