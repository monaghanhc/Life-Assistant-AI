import { UserMemory } from "@/lib/types";

export function getSeedUserMemory(): UserMemory {
  return {
    fullName: "Jordan Rivera",
    email: "jordan.rivera@example.com",
    phone: "(555) 014-7712",
    address: "124 Atlantic Ave, Brooklyn, NY",
    tonePreference: "firm_legal",
    landlordContact: "landlord@crown-heights-properties.example",
    recurringPainPoints: [
      "Unexpected billing changes",
      "Slow landlord maintenance responses",
      "Subscriptions that are hard to cancel",
    ],
    priorCases: [
      {
        category: "refund_request",
        targetName: "Metro Energy",
        outcome: "Refund issued after itemized dispute",
      },
      {
        category: "service_outage",
        targetName: "Airline customer care",
        outcome: "Travel voucher after delay complaint",
      },
    ],
  };
}
