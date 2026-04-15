import { NextResponse } from "next/server";

type SendChannel = "email" | "sms" | "copy";

interface SendPayload {
  channel: SendChannel;
  recipient?: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<SendPayload>;
  if (!payload.channel || !payload.subject?.trim() || !payload.message?.trim()) {
    return NextResponse.json(
      { error: "Channel, subject, and message are required." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  if (payload.channel === "copy") {
    return NextResponse.json({
      status: "ready_to_copy",
      timestamp: now,
      channel: "copy",
    });
  }

  return NextResponse.json({
    status: "queued",
    timestamp: now,
    channel: payload.channel,
    recipient: payload.recipient || "not provided",
  });
}
