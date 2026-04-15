# Life Admin AI

Life Admin AI is a full-stack MVP for offloading painful real-life admin work.
The current build focuses on one high-value loop:

1. Describe the problem.
2. Attach supporting proof.
3. Generate a structured admin packet.
4. Send or copy the drafted message.

## What the MVP does

- Accepts a plain-language issue plus an optional category.
- Supports attachment metadata for screenshots, photos, or documents.
- Produces a draft message, recommended target team, escalation steps, and a send shortcut.
- Uses a small memory layer to inject saved contact details, tone, and availability into the output.
- Uses the OpenAI Responses API when `OPENAI_API_KEY` is set, and falls back to a deterministic local generator when it is not.

## Secrets

- Local secrets belong in `.env.local`.
- `.env.local` is ignored by Git.
- Start from `.env.example`.
- This repo does not contain real API keys, and the app will not attempt to fetch or generate them for you.

Example:

```bash
cp .env.example .env.local
```

Then set:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.2
```

## Run locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```
