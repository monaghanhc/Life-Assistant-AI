import { UserMemory } from "@/lib/types";

export function getSeedUserMemory(): UserMemory {
  return {
    fullName: "Jordan Rivera",
    email: "jordan.rivera@example.com",
    phone: "(555) 014-7712",
    city: "Brooklyn, NY",
    tonePreference: "firm",
    availabilityWindow: "Weekdays after 4:30 PM Eastern",
    escalationStyle: "Polite first, then escalate with deadlines and documentation",
    recurringPainPoints: [
      "Unexpected billing changes",
      "Slow landlord maintenance responses",
      "Subscriptions that are hard to cancel",
    ],
    priorCases: [
      {
        category: "bill_dispute",
        targetName: "Metro Energy",
        outcome: "Refund issued after itemized dispute",
      },
      {
        category: "file_complaint",
        targetName: "Airline customer care",
        outcome: "Travel voucher after delay complaint",
      },
    ],
  };
}
