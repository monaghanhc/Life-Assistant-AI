export type TaskCategory =
  | "bill_dispute"
  | "landlord_employer"
  | "cancel_subscription"
  | "schedule_appointment"
  | "file_complaint"
  | "general_admin";

export type ToneOption = "firm" | "warm" | "direct" | "formal";

export type ContactChannel = "email" | "phone" | "portal" | "chat";

export interface AttachmentMeta {
  name: string;
  type: string;
  sizeKb: number;
}

export interface AssistRequest {
  category: TaskCategory | "auto";
  customerName?: string;
  targetName: string;
  contactEmail?: string;
  issue: string;
  desiredOutcome: string;
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
  city: string;
  tonePreference: ToneOption;
  availabilityWindow: string;
  escalationStyle: string;
  recurringPainPoints: string[];
  priorCases: CaseMemory[];
}

export interface ContactTarget {
  team: string;
  channel: ContactChannel;
  address: string;
  reason: string;
}

export interface DraftMessage {
  subject: string;
  body: string;
}

export interface SendAction {
  label: string;
  href: string;
  kind: "mailto" | "copy" | "info";
}

export interface AdminPacket {
  resolvedCategory: TaskCategory;
  headline: string;
  summary: string;
  contactTarget: ContactTarget;
  draftMessage: DraftMessage;
  suggestedNextSteps: string[];
  sendAction: SendAction;
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
