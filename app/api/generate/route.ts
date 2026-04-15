import { NextResponse } from "next/server";

import { generateAssistResponse } from "@/lib/assist-service";
import { getMemory } from "@/lib/memory-store";
import { AssistRequest } from "@/lib/types";

const DEFAULT_USER = "demo-user";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AssistRequest>;
  if (!payload.issue?.trim()) {
    return NextResponse.json({ error: "Issue is required." }, { status: 400 });
  }

  const assistRequest: AssistRequest = {
    category: payload.category ?? "auto",
    customerName: payload.customerName?.trim(),
    targetName: payload.targetName?.trim(),
    contactEmail: payload.contactEmail?.trim(),
    contactPhone: payload.contactPhone?.trim(),
    issue: payload.issue.trim(),
    desiredOutcome: payload.desiredOutcome?.trim(),
    deadline: payload.deadline?.trim(),
    tone: payload.tone ?? "firm_legal",
    preferredChannel: payload.preferredChannel ?? "email",
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  };

  const memory = getMemory(DEFAULT_USER);
  const response = await generateAssistResponse(assistRequest, memory);
  return NextResponse.json(response);
}
