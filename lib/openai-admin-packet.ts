import "server-only";

import OpenAI from "openai";

import { getOpenAiConfig } from "@/lib/env";
import {
  buildSendOptions,
  generateFallbackAdminPacket,
  getCategoryLabel,
  inferCategory,
} from "@/lib/generate-admin-packet";
import {
  AdminPacket,
  AssistRequest,
  TaskCategory,
  UserMemory,
} from "@/lib/types";

interface OpenAiAdminDraft {
  issue?: string;
  action?: string;
  contactTarget?: {
    name?: string;
    address?: string;
    reason?: string;
  };
  messages?: {
    friendly?: {
      subject?: string;
      body?: string;
    };
    firm_legal?: {
      subject?: string;
      body?: string;
    };
  };
  suggestedNextSteps?: string[];
  memorySignals?: string[];
}

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;

export async function generateOpenAiAdminPacket(
  request: AssistRequest,
  memory: UserMemory,
): Promise<AdminPacket | null> {
  const config = getOpenAiConfig();
  if (!config) {
    return null;
  }

  const client = getClient(config.apiKey);
  const fallbackPacket = generateFallbackAdminPacket(request, memory);
  const resolvedCategory =
    request.category === "auto" ? inferCategory(request) : request.category;

  const response = await client.responses.create({
    model: config.model,
    max_output_tokens: 1400,
    instructions: [
      "You generate life-admin action packets for consumers.",
      "Return only valid JSON and no markdown.",
      "Do not invent laws, promises, or contact details that were not provided.",
      "Keep the message actionable, concise, and ready to send.",
      "Preserve the user's requested tone and desired outcome.",
      'Use this JSON shape: {"issue":"string","action":"string","contactTarget":{"name":"string","address":"string","reason":"string"},"messages":{"friendly":{"subject":"string","body":"string"},"firm_legal":{"subject":"string","body":"string"}},"suggestedNextSteps":["string"],"memorySignals":["string"]}',
    ].join(" "),
    input: buildInput(request, memory, resolvedCategory, fallbackPacket),
  });

  const parsedDraft = parseJsonDraft(response.output_text);
  if (!parsedDraft) {
    return null;
  }

  return mergeDraftWithFallback(fallbackPacket, parsedDraft, request);
}

function getClient(apiKey: string): OpenAI {
  if (cachedClient && cachedKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new OpenAI({ apiKey });
  cachedKey = apiKey;
  return cachedClient;
}

function buildInput(
  request: AssistRequest,
  memory: UserMemory,
  category: TaskCategory,
  fallbackPacket: AdminPacket,
): string {
  const attachments =
    request.attachments.length > 0
      ? request.attachments
          .map((item) => `${item.name} (${item.type}, ${item.sizeKb} KB)`)
          .join("; ")
      : "none";

  return [
    `Resolved category: ${category} (${getCategoryLabel(category)})`,
    `Target name: ${request.targetName || "Support team"}`,
    `Preferred channel: ${request.preferredChannel}`,
    `Tone: ${request.tone}`,
    `Issue: ${request.issue}`,
    `Desired outcome: ${request.desiredOutcome || "not provided"}`,
    `Deadline: ${request.deadline || "not provided"}`,
    `Contact email provided: ${request.contactEmail || "none"}`,
    `Attachments: ${attachments}`,
    `User memory name: ${request.customerName || memory.fullName}`,
    `User memory email: ${memory.email}`,
    `User memory phone: ${memory.phone}`,
    `User memory address: ${memory.address}`,
    `User landlord contact: ${memory.landlordContact || "none"}`,
    `Prior cases: ${memory.priorCases.map((item) => `${item.targetName} -> ${item.outcome}`).join("; ")}`,
    `Fallback contact target: ${fallbackPacket.contactTarget.name} | ${fallbackPacket.contactTarget.address}`,
    `Fallback legal subject: ${fallbackPacket.messages.firm_legal.subject}`,
  ].join("\n");
}

function parseJsonDraft(raw: string): OpenAiAdminDraft | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const direct = tryParseJson(trimmed);
  if (direct) {
    return direct;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return tryParseJson(trimmed.slice(start, end + 1));
}

function tryParseJson(value: string): OpenAiAdminDraft | null {
  try {
    return JSON.parse(value) as OpenAiAdminDraft;
  } catch {
    return null;
  }
}

function mergeDraftWithFallback(
  fallbackPacket: AdminPacket,
  draft: OpenAiAdminDraft,
  request: AssistRequest,
): AdminPacket {
  const draftMessage = {
    friendly: {
      subject:
        cleanText(draft.messages?.friendly?.subject) ||
        fallbackPacket.messages.friendly.subject,
      body:
        cleanText(draft.messages?.friendly?.body) ||
        fallbackPacket.messages.friendly.body,
    },
    firm_legal: {
      subject:
        cleanText(draft.messages?.firm_legal?.subject) ||
        fallbackPacket.messages.firm_legal.subject,
      body:
        cleanText(draft.messages?.firm_legal?.body) ||
        fallbackPacket.messages.firm_legal.body,
    },
  };

  return {
    ...fallbackPacket,
    issue: cleanText(draft.issue) || fallbackPacket.issue,
    action: cleanText(draft.action) || fallbackPacket.action,
    contactTarget: {
      ...fallbackPacket.contactTarget,
      name: cleanText(draft.contactTarget?.name) || fallbackPacket.contactTarget.name,
      address:
        cleanText(draft.contactTarget?.address) ||
        fallbackPacket.contactTarget.address,
      reason:
        cleanText(draft.contactTarget?.reason) || fallbackPacket.contactTarget.reason,
    },
    messages: draftMessage,
    suggestedNextSteps:
      cleanList(draft.suggestedNextSteps) || fallbackPacket.suggestedNextSteps,
    memorySignals: cleanList(draft.memorySignals) || fallbackPacket.memorySignals,
    sendOptions: buildSendOptions(
      request.contactEmail,
      request.contactPhone,
      draftMessage.firm_legal.subject,
      draftMessage.firm_legal.body,
    ),
  };
}

function cleanText(value: string | undefined): string {
  return value?.replace(/\r\n/g, "\n").trim() || "";
}

function cleanList(values: string[] | undefined): string[] | null {
  if (!Array.isArray(values)) {
    return null;
  }

  const cleaned = values
    .map((value) => cleanText(value))
    .filter(Boolean)
    .slice(0, 6);

  return cleaned.length > 0 ? cleaned : null;
}
