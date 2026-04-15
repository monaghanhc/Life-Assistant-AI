import { NextResponse } from "next/server";

import { getMemory, updateMemory } from "@/lib/memory-store";
import { UserMemory } from "@/lib/types";

const DEFAULT_USER = "demo-user";

export async function GET() {
  return NextResponse.json({
    userId: DEFAULT_USER,
    memory: getMemory(DEFAULT_USER),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<UserMemory>;
  const memory = updateMemory(DEFAULT_USER, payload);
  return NextResponse.json({
    userId: DEFAULT_USER,
    memory,
  });
}
