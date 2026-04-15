import { describe, expect, it } from "vitest";

import { generateAdminPacket } from "@/lib/generate-admin-packet";
import { AssistRequest } from "@/lib/types";
import { getSeedUserMemory } from "@/lib/user-memory";

describe("generateAdminPacket", () => {
  it("infers a bill dispute and creates an email action", () => {
    const request: AssistRequest = {
      category: "auto",
      customerName: "Jordan Rivera",
      targetName: "Metro Energy",
      contactEmail: "billing@metroenergy.example",
      issue:
        "I was charged a late fee after autopay processed on time, and the bill total looks inflated.",
      desiredOutcome: "Remove the fee and issue a corrected bill.",
      deadline: "April 22, 2026",
      tone: "firm",
      preferredChannel: "email",
      attachments: [
        {
          name: "statement.png",
          type: "image/png",
          sizeKb: 244,
        },
      ],
    };

    const packet = generateAdminPacket(request, getSeedUserMemory());

    expect(packet.resolvedCategory).toBe("bill_dispute");
    expect(packet.contactTarget.channel).toBe("email");
    expect(packet.sendAction.kind).toBe("mailto");
    expect(packet.draftMessage.body).toContain("statement.png");
    expect(packet.draftMessage.subject).toContain("Metro Energy");
  });

  it("uses a copy action for non-email flows", () => {
    const request: AssistRequest = {
      category: "schedule_appointment",
      customerName: "Jordan Rivera",
      targetName: "Prospect Dental",
      issue: "I need to book a cleaning and would prefer a late afternoon slot.",
      desiredOutcome: "Schedule the earliest available appointment after 4:30 PM.",
      tone: "warm",
      preferredChannel: "phone",
      attachments: [],
    };

    const packet = generateAdminPacket(request, getSeedUserMemory());

    expect(packet.sendAction.kind).toBe("copy");
    expect(
      packet.suggestedNextSteps.some((step) => step.includes("time windows")),
    ).toBe(true);
  });
});
