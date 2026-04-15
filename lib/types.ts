export type TaskCategory =
  | "landlord_issue"
  | "refund_request"
  | "subscription_cancel"
  | "work_complaint"
  | "service_outage"
  | "other";

export type ToneOption = "friendly" | "firm_legal";

export type ContactChannel = "email" | "sms" | "copy";

export interface AttachmentMeta {
  name: string;
  type: string;
  sizeKb: number;
}

export interface AssistRequest {
  category: TaskCategory | "auto";
  customerName?: string;
  targetName?: string;
  contactEmail?: string;
  contactPhone?: string;
  issue: string;
  desiredOutcome?: string;
  deadline?: string;
  tone: ToneOption;
  preferredChannel: ContactChannel;
  attachments: AttachmentMeta[];
}

export interface CaseMemory {
  category: TaskCategory;
  targetName: string;
  outcome: string;
}

export interface UserMemory {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  tonePreference: ToneOption;
  landlordContact?: string;
  recurringPainPoints: string[];
  priorCases: CaseMemory[];
}

export interface ContactTarget {
  name: string;
  channel: ContactChannel;
  address: string;
  reason: string;
}

export interface DraftMessage {
  subject: string;
  body: string;
}

export interface MessageVariants {
  friendly: DraftMessage;
  firm_legal: DraftMessage;
}

export interface SendActionOption {
  channel: "email" | "sms" | "copy";
  label: string;
  href: string;
}

export interface AdminPacket {
  resolvedCategory: TaskCategory;
  issue: string;
  action: string;
  contactTarget: ContactTarget;
  messages: MessageVariants;
  suggestedNextSteps: string[];
  sendOptions: SendActionOption[];
  memorySignals: string[];
}

export interface ProviderStatus {
  provider: "openai" | "fallback";
  model: string;
  hasConfiguredKey: boolean;
  message: string;
}

export interface AssistResponsePayload {
  memory: UserMemory;
  packet: AdminPacket;
  provider: ProviderStatus;
}
