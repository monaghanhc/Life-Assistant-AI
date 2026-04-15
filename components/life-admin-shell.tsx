"use client";

import { ChangeEvent, useState } from "react";

import {
  AdminPacket,
  AssistRequest,
  AssistResponsePayload,
  AttachmentMeta,
  ContactChannel,
  ProviderStatus,
  TaskCategory,
  ToneOption,
  UserMemory,
} from "@/lib/types";

const TASK_OPTIONS: Array<{ value: TaskCategory | "auto"; label: string }> = [
  { value: "auto", label: "Auto-detect from problem" },
  { value: "bill_dispute", label: "Dispute a bill" },
  { value: "landlord_employer", label: "Landlord or employer issue" },
  { value: "cancel_subscription", label: "Cancel a subscription" },
  { value: "schedule_appointment", label: "Schedule an appointment" },
  { value: "file_complaint", label: "File a complaint" },
  { value: "general_admin", label: "General admin help" },
];

const CHANNEL_OPTIONS: Array<{ value: ContactChannel; label: string }> = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "portal", label: "Portal" },
  { value: "chat", label: "Chat" },
];

const TONE_OPTIONS: Array<{ value: ToneOption; label: string }> = [
  { value: "firm", label: "Firm" },
  { value: "warm", label: "Warm" },
  { value: "direct", label: "Direct" },
  { value: "formal", label: "Formal" },
];

const SAMPLE_CASE: AssistRequest = {
  category: "bill_dispute",
  customerName: "Jordan Rivera",
  targetName: "Metro Energy",
  contactEmail: "billing@metroenergy.example",
  issue:
    "My utility bill jumped by $124 this month even though my usage was lower than the previous cycle. I already called once and did not get a clear explanation.",
  desiredOutcome:
    "A corrected bill, a clear itemized explanation, and a refund or credit for any overcharge.",
  deadline: "April 22, 2026",
  tone: "firm",
  preferredChannel: "email",
  attachments: [],
};

export function LifeAdminShell({
  memory,
  provider,
}: {
  memory: UserMemory;
  provider: ProviderStatus;
}) {
  const [form, setForm] = useState<AssistRequest>({
    category: "auto",
    customerName: memory.fullName,
    targetName: "",
    contactEmail: "",
    issue: "",
    desiredOutcome: "",
    deadline: "",
    tone: memory.tonePreference,
    preferredChannel: "email",
    attachments: [],
  });
  const [packet, setPacket] = useState<AdminPacket | null>(null);
  const [activeMemory, setActiveMemory] = useState(memory);
  const [activeProvider, setActiveProvider] = useState(provider);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  function updateField<Key extends keyof AssistRequest>(
    key: Key,
    value: AssistRequest[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function loadSampleCase() {
    setForm(SAMPLE_CASE);
    setPacket(null);
    setError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const attachments: AttachmentMeta[] = files.map((file) => ({
      name: file.name,
      type: file.type || "unknown",
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
    }));

    updateField("attachments", attachments);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopyState("idle");
    setError(null);
    setIsSubmitting(true);
    void submitRequest();
  }

  async function submitRequest() {
    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as AssistResponsePayload | {
        error: string;
      };

      if (!response.ok || !("packet" in payload)) {
        throw new Error(
          "error" in payload
            ? payload.error
            : "Unable to generate the admin plan.",
        );
      }

      setPacket(payload.packet);
      setActiveMemory(payload.memory);
      setActiveProvider(payload.provider);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to generate the admin plan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyDraft() {
    if (!packet) {
      return;
    }

    await navigator.clipboard.writeText(
      `${packet.draftMessage.subject}\n\n${packet.draftMessage.body}`,
    );
    setCopyState("copied");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Life Admin AI</span>
          <h1>Turn "fix this for me" into a ready-to-send action plan.</h1>
          <p className="hero-text">
            Upload the problem, pick the target, and get a structured admin
            packet: drafted message, contact target, escalation steps, and
            one-click send.
          </p>
          <div className="hero-actions">
            <button
              className="secondary-button"
              onClick={loadSampleCase}
              type="button"
            >
              Load sample case
            </button>
            <div className="memory-badge">
              <strong>Memory ready</strong>
              <span>{activeMemory.escalationStyle}</span>
            </div>
            <div className="memory-badge provider-badge">
              <strong>
                {activeProvider.provider === "openai"
                  ? "Live provider"
                  : "Fallback mode"}
              </strong>
              <span>{activeProvider.message}</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="signal-card">
            <span className="signal-label">Live use cases</span>
            <strong>Billing, landlord, HR, subscriptions, appointments</strong>
          </div>
          <div className="signal-card">
            <span className="signal-label">Remembered about you</span>
            <strong>{activeMemory.availabilityWindow}</strong>
          </div>
          <div className="signal-card">
            <span className="signal-label">Last resolved</span>
            <strong>{activeMemory.priorCases[0]?.outcome}</strong>
          </div>
          <div className="signal-card">
            <span className="signal-label">Current model</span>
            <strong>{activeProvider.model}</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <form className="intake-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Intake</span>
              <h2>Describe the admin problem</h2>
            </div>
            <p>
              Start with plain language. The assistant turns it into a message
              and next-step workflow.
            </p>
          </div>

          <div className="form-grid">
            <label>
              <span>Task type</span>
              <select
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value as TaskCategory | "auto",
                  )
                }
                value={form.category}
              >
                {TASK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Tone</span>
              <select
                onChange={(event) =>
                  updateField("tone", event.target.value as ToneOption)
                }
                value={form.tone}
              >
                {TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Your name</span>
              <input
                onChange={(event) =>
                  updateField("customerName", event.target.value)
                }
                placeholder="Jordan Rivera"
                value={form.customerName ?? ""}
              />
            </label>

            <label>
              <span>Preferred channel</span>
              <select
                onChange={(event) =>
                  updateField(
                    "preferredChannel",
                    event.target.value as ContactChannel,
                  )
                }
                value={form.preferredChannel}
              >
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Target company or person</span>
              <input
                onChange={(event) => updateField("targetName", event.target.value)}
                placeholder="Metro Energy"
                value={form.targetName}
              />
            </label>

            <label>
              <span>Contact email</span>
              <input
                onChange={(event) =>
                  updateField("contactEmail", event.target.value)
                }
                placeholder="billing@company.com"
                value={form.contactEmail ?? ""}
              />
            </label>

            <label className="full-span">
              <span>What happened?</span>
              <textarea
                onChange={(event) => updateField("issue", event.target.value)}
                placeholder="Explain the problem in your own words."
                rows={6}
                value={form.issue}
              />
            </label>

            <label className="full-span">
              <span>Desired outcome</span>
              <textarea
                onChange={(event) =>
                  updateField("desiredOutcome", event.target.value)
                }
                placeholder="What do you want the other side to do?"
                rows={4}
                value={form.desiredOutcome}
              />
            </label>

            <label>
              <span>Deadline or timing</span>
              <input
                onChange={(event) => updateField("deadline", event.target.value)}
                placeholder="April 22, 2026"
                value={form.deadline ?? ""}
              />
            </label>

            <label>
              <span>Upload proof</span>
              <input
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileChange}
                type="file"
              />
            </label>
          </div>

          {form.attachments.length > 0 ? (
            <div className="attachment-strip">
              {form.attachments.map((item) => (
                <span className="attachment-pill" key={item.name}>
                  {item.name} | {item.sizeKb} KB
                </span>
              ))}
            </div>
          ) : null}

          {error ? <p className="error-banner">{error}</p> : null}

          {!activeProvider.hasConfiguredKey ? (
            <p className="setup-banner">
              Add <code>OPENAI_API_KEY</code> to <code>.env.local</code> to
              enable live model output. Local env files are gitignored.
            </p>
          ) : null}

          <div className="submit-row">
            <button
              className="primary-button"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Building admin packet..."
                : "Fix this problem for me"}
            </button>
            <p className="helper-text">
              MVP output includes a draft, target recommendation, next steps,
              and send shortcut.
            </p>
          </div>
        </form>

        <section className="results-card" id="draft-message">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Output</span>
              <h2>
                {packet ? packet.headline : "Structured response appears here"}
              </h2>
            </div>
            <p>
              {packet
                ? packet.summary
                : "Submit a case to generate a message, identify the best target, and prepare the escalation path."}
            </p>
          </div>

          {packet ? (
            <>
              <div className="result-block">
                <span className="result-label">Best contact target</span>
                <h3>{packet.contactTarget.team}</h3>
                <p>
                  {packet.contactTarget.channel.toUpperCase()} |{" "}
                  {packet.contactTarget.address}
                </p>
                <p>{packet.contactTarget.reason}</p>
              </div>

              <div className="result-block">
                <span className="result-label">Draft message</span>
                <h3>{packet.draftMessage.subject}</h3>
                <pre>{packet.draftMessage.body}</pre>
              </div>

              <div className="result-block">
                <span className="result-label">Suggested next steps</span>
                <ul>
                  {packet.suggestedNextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="result-block">
                <span className="result-label">Generation mode</span>
                <h3>
                  {activeProvider.provider === "openai"
                    ? "OpenAI live output"
                    : "Deterministic fallback output"}
                </h3>
                <p>{activeProvider.message}</p>
              </div>

              <div className="result-block">
                <span className="result-label">Memory used</span>
                <ul>
                  {packet.memorySignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>

              <div className="action-row">
                <a className="primary-button" href={packet.sendAction.href}>
                  {packet.sendAction.label}
                </a>
                <button
                  className="secondary-button"
                  onClick={copyDraft}
                  type="button"
                >
                  {copyState === "copied" ? "Copied" : "Copy draft"}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>
                Use this space to preview the assistant&apos;s generated packet
                before sending anything.
              </p>
              <div className="preview-grid">
                <div>
                  <strong>Message draft</strong>
                  <span>Subject line and full body tailored to the issue.</span>
                </div>
                <div>
                  <strong>Contact target</strong>
                  <span>The best department or person to approach first.</span>
                </div>
                <div>
                  <strong>Escalation steps</strong>
                  <span>
                    What to do if they ignore you, delay, or deny the request.
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
