import { describe, expect, it } from "vitest";

import { generateAdminPacket } from "@/lib/generate-admin-packet";
import { AssistRequest } from "@/lib/types";
import { getSeedUserMemory } from "@/lib/user-memory";

describe("generateAdminPacket", () => {
  it("infers a refund request and creates send options", () => {
    const request: AssistRequest = {
      category: "auto",
      customerName: "Jordan Rivera",
      targetName: "Metro Energy",
      contactEmail: "billing@metroenergy.example",
      contactPhone: "(555) 222-0101",
      issue:
        "I was charged a late fee after autopay processed on time, and the bill total looks inflated.",
      desiredOutcome: "Remove the fee and issue a corrected bill",
      deadline: "April 22, 2026",
      tone: "firm_legal",
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

    expect(packet.resolvedCategory).toBe("refund_request");
    expect(packet.contactTarget.channel).toBe("email");
    expect(packet.sendOptions.length).toBe(3);
    expect(packet.messages.firm_legal.body).toContain("statement.png");
    expect(packet.messages.firm_legal.subject).toContain("Metro Energy");
  });

  it("supports sms workflows", () => {
    const request: AssistRequest = {
      category: "service_outage",
      customerName: "Jordan Rivera",
      targetName: "FiberNet",
      contactPhone: "(555) 909-0000",
      issue: "Internet has been down for two days.",
      desiredOutcome: "Restore service and issue outage credit.",
      tone: "friendly",
      preferredChannel: "sms",
      attachments: [],
    };

    const packet = generateAdminPacket(request, getSeedUserMemory());

    expect(packet.contactTarget.channel).toBe("sms");
    expect(
      packet.suggestedNextSteps.some((step) => step.includes("credit")),
    ).toBe(true);
  });
});
