import {
  AdminPacket,
  AssistRequest,
  ContactChannel,
  TaskCategory,
  UserMemory,
} from "@/lib/types";

const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  bill_dispute: [
    "bill",
    "billing",
    "invoice",
    "charge",
    "charged",
    "fee",
    "refund",
    "utility",
    "overcharge",
    "payment",
  ],
  landlord_employer: [
    "landlord",
    "lease",
    "apartment",
    "rent",
    "maintenance",
    "repair",
    "deposit",
    "hr",
    "payroll",
    "manager",
    "employer",
    "workplace",
  ],
  cancel_subscription: [
    "cancel",
    "subscription",
    "membership",
    "renewal",
    "terminate",
    "trial",
  ],
  schedule_appointment: [
    "appointment",
    "schedule",
    "reschedule",
    "doctor",
    "clinic",
    "dentist",
    "service call",
    "book",
  ],
  file_complaint: [
    "complaint",
    "report",
    "damaged",
    "incident",
    "fraud",
    "consumer",
    "bad service",
    "safety",
  ],
  general_admin: [],
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  bill_dispute: "bill dispute",
  landlord_employer: "landlord or employer issue",
  cancel_subscription: "subscription cancellation",
  schedule_appointment: "appointment scheduling",
  file_complaint: "formal complaint",
  general_admin: "life admin request",
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
  const personName = request.customerName?.trim() || memory.fullName;
  const tone = request.tone || memory.tonePreference;
  const channel = request.preferredChannel || inferChannel(resolvedCategory);
  const summary = buildSummary(request, resolvedCategory);
  const contactTarget = buildContactTarget(request, resolvedCategory, channel);
  const draftMessage = buildDraftMessage(
    request,
    memory,
    personName,
    resolvedCategory,
    tone,
    contactTarget.address,
  );
  const suggestedNextSteps = buildNextSteps(
    request,
    resolvedCategory,
    contactTarget.channel,
  );
  const sendAction = buildSendAction(
    request.contactEmail,
    draftMessage.subject,
    draftMessage.body,
    channel,
  );

  return {
    resolvedCategory,
    headline: `Ready-to-send ${CATEGORY_LABELS[resolvedCategory]} packet`,
    summary,
    contactTarget,
    draftMessage,
    suggestedNextSteps,
    sendAction,
    memorySignals: buildMemorySignals(memory, request, tone),
  };
}

export function inferCategory(request: AssistRequest): TaskCategory {
  const haystack = `${request.targetName} ${request.issue} ${request.desiredOutcome}`.toLowerCase();
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

  return "general_admin";
}

export function inferChannel(category: TaskCategory): ContactChannel {
  switch (category) {
    case "schedule_appointment":
      return "phone";
    case "cancel_subscription":
      return "chat";
    case "file_complaint":
      return "portal";
    default:
      return "email";
  }
}

export function getCategoryLabel(category: TaskCategory): string {
  return CATEGORY_LABELS[category];
}

function buildSummary(request: AssistRequest, category: TaskCategory): string {
  const target = request.targetName.trim() || "the target organization";
  return `This ${CATEGORY_LABELS[category]} packet is focused on ${target}. The request centers on "${request.desiredOutcome.trim()}" and includes a clear summary, escalation path, and ready-to-send message.`;
}

function buildContactTarget(
  request: AssistRequest,
  category: TaskCategory,
  channel: ContactChannel,
) {
  const targetName = request.targetName.trim() || "Target organization";
  const contactEmail = request.contactEmail?.trim();

  const teamMap: Record<TaskCategory, string> = {
    bill_dispute: "billing or retention team",
    landlord_employer: "property manager, landlord, HR, or direct supervisor",
    cancel_subscription: "retention or account support team",
    schedule_appointment: "front desk or scheduling coordinator",
    file_complaint: "customer care or formal complaint desk",
    general_admin: "support or operations team",
  };

  const address =
    contactEmail ||
    (channel === "phone"
      ? "Use the published phone line or front desk number"
      : channel === "portal"
        ? "Use the official support or complaint portal"
        : "Use the published support inbox or primary contact address");

  return {
    team: `${targetName} ${teamMap[category]}`,
    channel,
    address,
    reason: `Best first stop for a ${CATEGORY_LABELS[category]} because this team can confirm receipt, document the issue, and resolve or escalate it quickly.`,
  };
}

function buildDraftMessage(
  request: AssistRequest,
  memory: UserMemory,
  personName: string,
  category: TaskCategory,
  tone: string,
  addressHint: string,
) {
  const targetName = request.targetName.trim() || "your team";
  const intro = buildToneIntro(tone, category);
  const attachmentLine = request.attachments.length
    ? `I have attached supporting materials: ${request.attachments
        .map((item) => item.name)
        .join(", ")}.`
    : "I can provide supporting screenshots, documents, or photos if needed.";
  const deadlineLine = request.deadline?.trim()
    ? `Please respond by ${request.deadline.trim()} or let me know the expected timeline.`
    : "Please confirm next steps and the expected resolution timeline.";

  return {
    subject: composeSubject(request, category),
    body: [
      `Hello ${targetName},`,
      "",
      intro,
      `I am writing about the following issue: ${request.issue.trim()}`,
      `What I need: ${request.desiredOutcome.trim()}.`,
      deadlineLine,
      attachmentLine,
      "",
      `For coordination, my preferred contact details are ${memory.email} and ${memory.phone}.`,
      `My usual availability is ${memory.availabilityWindow}.`,
      "",
      "Please reply to confirm receipt. If this needs to be routed elsewhere, please forward it to the correct team or let me know where to send it instead.",
      "",
      "Thank you,",
      personName,
      `${memory.city}`,
      `Contact route noted in assistant plan: ${addressHint}`,
    ].join("\n"),
  };
}

function buildToneIntro(tone: string, category: TaskCategory): string {
  switch (tone) {
    case "warm":
      return `Thanks in advance for reviewing this ${CATEGORY_LABELS[category]} request. I am hoping we can resolve it quickly and clearly.`;
    case "direct":
      return `I need help resolving this ${CATEGORY_LABELS[category]} request and want to make the facts and requested outcome clear upfront.`;
    case "formal":
      return `Please treat this as a formal ${CATEGORY_LABELS[category]} request requiring documented follow-up.`;
    default:
      return `I am reaching out to resolve this ${CATEGORY_LABELS[category]} in a straightforward and documented way.`;
  }
}

function composeSubject(request: AssistRequest, category: TaskCategory): string {
  const target = request.targetName.trim() || "Support";
  const outcome = request.desiredOutcome.trim();
  const prefixMap: Record<TaskCategory, string> = {
    bill_dispute: "Billing issue",
    landlord_employer: "Follow-up request",
    cancel_subscription: "Cancellation request",
    schedule_appointment: "Scheduling request",
    file_complaint: "Formal complaint",
    general_admin: "Support request",
  };

  return `${prefixMap[category]} for ${target}: ${outcome}`;
}

function buildNextSteps(
  request: AssistRequest,
  category: TaskCategory,
  channel: ContactChannel,
): string[] {
  const baseSteps = [
    `Send the draft through ${channel} and keep a timestamped copy.`,
    "Save screenshots, bills, lease clauses, or receipts in one folder before sending.",
  ];

  if (request.deadline?.trim()) {
    baseSteps.push(`If there is no response by ${request.deadline.trim()}, send a shorter escalation follow-up.`);
  } else {
    baseSteps.push("If there is no response within 3 business days, send a shorter escalation follow-up.");
  }

  switch (category) {
    case "bill_dispute":
      baseSteps.push("Ask for an itemized explanation, refund amount, and confirmation that late fees will be paused during review.");
      break;
    case "landlord_employer":
      baseSteps.push("Reference any lease clause, policy, or written prior notice when you follow up.");
      break;
    case "cancel_subscription":
      baseSteps.push("Ask for written confirmation that renewal and future charges are fully stopped.");
      break;
    case "schedule_appointment":
      baseSteps.push("Offer two or three specific time windows to reduce back-and-forth.");
      break;
    case "file_complaint":
      baseSteps.push("Request a case number and the date when the complaint review will be completed.");
      break;
    default:
      baseSteps.push("Clarify the owner of the request and the next concrete action they need to take.");
      break;
  }

  return baseSteps;
}

export function buildSendAction(
  contactEmail: string | undefined,
  subject: string,
  body: string,
  channel: ContactChannel,
) {
  if (channel === "email") {
    const href = `mailto:${contactEmail?.trim() || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return {
      label: contactEmail?.trim() ? "Open drafted email" : "Open email draft",
      href,
      kind: "mailto" as const,
    };
  }

  return {
    label: "Copy draft for sending",
    href: "#draft-message",
    kind: "copy" as const,
  };
}

function buildMemorySignals(
  memory: UserMemory,
  request: AssistRequest,
  tone: string,
): string[] {
  const signals = [
    `Used preferred tone: ${tone}.`,
    `Included saved contact details: ${memory.email} and ${memory.phone}.`,
    `Applied remembered availability window: ${memory.availabilityWindow}.`,
  ];

  const priorMatch = memory.priorCases.find(
    (item) => item.targetName === request.targetName.trim(),
  );
  if (priorMatch) {
    signals.push(
      `Matched a prior case with ${priorMatch.targetName}: ${priorMatch.outcome}.`,
    );
  }

  return signals;
}
