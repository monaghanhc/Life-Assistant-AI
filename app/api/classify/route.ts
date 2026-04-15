import { NextResponse } from "next/server";

import { inferCategory } from "@/lib/generate-admin-packet";
import { AssistRequest } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AssistRequest>;
  if (!payload.issue?.trim()) {
    return NextResponse.json({ error: "Issue is required." }, { status: 400 });
  }

  const category = inferCategory({
    category: "auto",
    issue: payload.issue.trim(),
    desiredOutcome: payload.desiredOutcome?.trim(),
    targetName: payload.targetName?.trim(),
    tone: payload.tone ?? "firm_legal",
    preferredChannel: payload.preferredChannel ?? "email",
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  });

  return NextResponse.json({
    category,
    issueSummary: payload.issue.trim(),
  });
}
