import { NextResponse } from "next/server";

import { generateAssistResponse } from "@/lib/assist-service";
import { AssistRequest } from "@/lib/types";
import { getSeedUserMemory } from "@/lib/user-memory";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AssistRequest>;

  if (!payload.issue?.trim() || !payload.desiredOutcome?.trim()) {
    return NextResponse.json(
      {
        error: "Issue and desired outcome are required.",
      },
      { status: 400 },
    );
  }

  const assistRequest: AssistRequest = {
    category: payload.category ?? "auto",
    customerName: payload.customerName?.trim(),
    targetName: payload.targetName?.trim() || "Support team",
    contactEmail: payload.contactEmail?.trim(),
    issue: payload.issue.trim(),
    desiredOutcome: payload.desiredOutcome.trim(),
    deadline: payload.deadline?.trim(),
    tone: payload.tone ?? "firm",
    preferredChannel: payload.preferredChannel ?? "email",
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  };

  const memory = getSeedUserMemory();
  const response = await generateAssistResponse(assistRequest, memory);

  return NextResponse.json(response);
}
