import { UserMemory } from "@/lib/types";
import { getSeedUserMemory } from "@/lib/user-memory";

const store = new Map<string, UserMemory>();

export function getMemory(userId: string): UserMemory {
  const existing = store.get(userId);
  if (existing) {
    return existing;
  }

  const seeded = getSeedUserMemory();
  store.set(userId, seeded);
  return seeded;
}

export function updateMemory(
  userId: string,
  patch: Partial<UserMemory>,
): UserMemory {
  const current = getMemory(userId);
  const updated: UserMemory = {
    ...current,
    ...patch,
    priorCases: patch.priorCases ?? current.priorCases,
    recurringPainPoints: patch.recurringPainPoints ?? current.recurringPainPoints,
  };
  store.set(userId, updated);
  return updated;
}
