import {
  AdminPacket,
  AssistRequest,
  ContactChannel,
  TaskCategory,
  ToneOption,
  UserMemory,
} from "@/lib/types";

const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  landlord_issue: [
    "landlord",
    "lease",
    "apartment",
    "rent",
    "mold",
    "repair",
    "maintenance",
    "deposit",
    "tenant",
  ],
  refund_request: [
    "refund",
    "charge",
    "overcharge",
    "billing",
    "invoice",
    "fee",
    "credit",
    "money back",
    "reimburse",
  ],
  subscription_cancel: [
    "cancel",
    "subscription",
    "membership",
    "renewal",
    "autopay",
    "terminate",
  ],
  work_complaint: [
    "manager",
    "hr",
    "employer",
    "workplace",
    "hostile",
    "harassment",
    "payroll",
    "schedule",
  ],
  service_outage: [
    "internet",
    "outage",
    "service down",
    "down for",
    "utility outage",
    "no service",
    "connection",
  ],
  other: [],
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  landlord_issue: "landlord issue",
  refund_request: "refund request",
  subscription_cancel: "subscription cancellation",
  work_complaint: "work complaint",
  service_outage: "service outage",
  other: "general admin request",
};

const TEMPLATE_LIBRARY: Record<
  TaskCategory,
  {
    action: string;
    team: string;
    reason: string;
    nextSteps: string[];
  }
> = {
  landlord_issue: {
    action: "Send documented complaint to landlord",
    team: "Landlord or property manager",
    reason: "Housing and maintenance issues need written notice and a deadline.",
    nextSteps: [
      "Send complaint and request acknowledgement within 24 hours.",
      "Attach photos and any prior maintenance requests.",
      "If no response, escalate with a final written notice in 3 business days.",
    ],
  },
  refund_request: {
    action: "Send itemized refund request",
    team: "Billing or retention team",
    reason: "Billing teams can issue credits and written adjustments.",
    nextSteps: [
      "Ask for itemized explanation of the disputed amount.",
      "Request confirmation that collection or fees are paused while reviewed.",
      "Escalate to a supervisor if unresolved within 3 business days.",
    ],
  },
  subscription_cancel: {
    action: "Submit cancellation with written confirmation request",
    team: "Retention or account support",
    reason: "Retention can confirm cancellation and stop renewals.",
    nextSteps: [
      "Request exact cancellation effective date.",
      "Ask for written confirmation that future charges are blocked.",
      "Dispute charge immediately if a renewal still posts.",
    ],
  },
  work_complaint: {
    action: "File formal work complaint",
    team: "HR or direct manager",
    reason: "Workplace issues require documented internal review.",
    nextSteps: [
      "Keep details factual and include dates, times, and witnesses.",
      "Request acknowledgement and expected review timeline.",
      "Follow up in writing if no response within 2 business days.",
    ],
  },
  service_outage: {
    action: "Request outage credit and service restoration timeline",
    team: "Service provider support or billing",
    reason: "Providers can apply outage credits and timeline commitments.",
    nextSteps: [
      "Request account credit for downtime period.",
      "Ask for restoration ETA and incident reference number.",
      "Escalate to billing if credit is denied.",
    ],
  },
  other: {
    action: "Send formal support request",
    team: "Support or operations team",
    reason: "A documented request creates an auditable timeline.",
    nextSteps: [
      "Request written acknowledgement and owner of the issue.",
      "Ask for concrete next step and expected resolution date.",
      "Escalate after 3 business days with your prior message included.",
    ],
  },
};

export function generateAdminPacket(
  request: AssistRequest,
  memory: UserMemory,
): AdminPacket {
  return generateFallbackAdminPacket(request, memory);
}

export function generateFallbackAdminPacket(
  request: AssistRequest,
  memory: UserMemory,
): AdminPacket {
  const resolvedCategory =
    request.category === "auto" ? inferCategory(request) : request.category;
  const chosenTemplate = TEMPLATE_LIBRARY[resolvedCategory];
  const customerName = request.customerName?.trim() || memory.fullName;
  const contactTarget = buildContactTarget(request, resolvedCategory, chosenTemplate);
  const friendly = buildDraftMessage(
    request,
    memory,
    customerName,
    resolvedCategory,
    "friendly",
    contactTarget.name,
  );
  const legal = buildDraftMessage(
    request,
    memory,
    customerName,
    resolvedCategory,
    "firm_legal",
    contactTarget.name,
  );

  return {
    resolvedCategory,
    issue: summarizeIssue(request, resolvedCategory),
    action: chosenTemplate.action,
    contactTarget,
    messages: {
      friendly,
      firm_legal: legal,
    },
    suggestedNextSteps: mergeSteps(chosenTemplate.nextSteps, request.deadline),
    sendOptions: buildSendOptions(
      request.contactEmail,
      request.contactPhone,
      legal.subject,
      legal.body,
    ),
    memorySignals: buildMemorySignals(memory, request),
  };
}

export function inferCategory(request: AssistRequest): TaskCategory {
  const haystack = `${request.targetName ?? ""} ${request.issue} ${request.desiredOutcome ?? ""}`.toLowerCase();
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => {
    const score = keywords.reduce((total, keyword) => {
      return total + (haystack.includes(keyword) ? 1 : 0);
    }, 0);
    return [category as TaskCategory, score] as const;
  });
  scores.sort((left, right) => right[1] - left[1]);
  if (scores[0]?.[1] && scores[0][1] > 0) {
    return scores[0][0];
  }
  return "other";
}

export function inferChannel(category: TaskCategory): ContactChannel {
  if (category === "service_outage") {
    return "sms";
  }
  return "email";
}

export function getCategoryLabel(category: TaskCategory): string {
  return CATEGORY_LABELS[category];
}

function summarizeIssue(request: AssistRequest, category: TaskCategory): string {
  const target = request.targetName?.trim() || "the responsible party";
  return `${CATEGORY_LABELS[category]} involving ${target}: ${request.issue.trim()}`;
}

function buildContactTarget(
  request: AssistRequest,
  category: TaskCategory,
  chosenTemplate: {
    team: string;
    reason: string;
  },
) {
  const targetName = request.targetName?.trim() || chosenTemplate.team;
  const preferred = request.preferredChannel || inferChannel(category);
  const address =
    preferred === "email"
      ? request.contactEmail?.trim() ||
        (category === "landlord_issue" ? "Use saved landlord email" : "Use support email")
      : preferred === "sms"
        ? request.contactPhone?.trim() || "Use support SMS or service number"
        : "Copy and send via your preferred channel";
  return {
    name: targetName,
    channel: preferred,
    address,
    reason: chosenTemplate.reason,
  };
}

function buildDraftMessage(
  request: AssistRequest,
  memory: UserMemory,
  personName: string,
  category: TaskCategory,
  tone: ToneOption,
  targetName: string,
) {
  const subjectPrefix = tone === "firm_legal" ? "Formal Notice" : "Request";
  const deadlineLine = request.deadline?.trim()
    ? `Please confirm by ${request.deadline.trim()}.`
    : "Please confirm receipt and next steps.";
  return {
    subject: `${subjectPrefix}: ${getCategoryLabel(category)} for ${targetName}`,
    body: [
      `Hello ${targetName},`,
      "",
      tone === "firm_legal"
        ? "This is a documented request requiring written follow-up."
        : "I am reaching out to resolve this issue quickly.",
      `Issue: ${request.issue.trim()}`,
      `Requested outcome: ${(request.desiredOutcome?.trim() || "Please resolve the issue and confirm completion.").trim()}`,
      deadlineLine,
      request.attachments.length > 0
        ? `Attached proof: ${request.attachments.map((item) => item.name).join(", ")}.`
        : "I can share supporting documentation on request.",
      "",
      `Name: ${personName}`,
      `Address: ${memory.address}`,
      `Contact: ${memory.email} | ${memory.phone}`,
    ].join("\n"),
  };
}

function mergeSteps(defaultSteps: string[], deadline: string | undefined): string[] {
  const steps = [...defaultSteps];
  if (deadline?.trim()) {
    steps.unshift(`Use the provided deadline (${deadline.trim()}) in your first message.`);
  }
  return steps.slice(0, 5);
}

export function buildSendOptions(
  contactEmail: string | undefined,
  contactPhone: string | undefined,
  subject: string,
  body: string,
) {
  return [
    {
      channel: "email" as const,
      label: contactEmail?.trim() ? "Open email draft" : "Email (add recipient)",
      href: `mailto:${contactEmail?.trim() || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
    {
      channel: "sms" as const,
      label: contactPhone?.trim() ? "Open SMS draft" : "SMS (add recipient)",
      href: `sms:${contactPhone?.trim() || ""}?body=${encodeURIComponent(`${subject}\n\n${body}`)}`,
    },
    {
      channel: "copy" as const,
      label: "Copy message",
      href: "#draft-message",
    },
  ];
}

function buildMemorySignals(memory: UserMemory, request: AssistRequest): string[] {
  const signals = [
    `Used saved user profile: ${memory.fullName}.`,
    `Used saved address: ${memory.address}.`,
    `Primary contact channel preference: ${request.preferredChannel}.`,
  ];
  if (memory.landlordContact) {
    signals.push(`Landlord contact remembered: ${memory.landlordContact}.`);
  }
  return signals;
}
