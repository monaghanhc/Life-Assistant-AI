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
- Produces issue diagnosis, dual-tone messages (friendly + firm/legal), target recommendation, and one-click send options.
- Uses a lightweight memory layer to inject saved profile details and recurring contacts into output.
- Uses the OpenAI Responses API when `OPENAI_API_KEY` is set, and falls back to a deterministic local generator when it is not.

## API routes

- `POST /api/classify`: classify problem into one of the MVP categories.
- `POST /api/generate`: generate the full structured action packet.
- `POST /api/send`: queue or prepare send action (`email`, `sms`, `copy`).
- `GET /api/memory`: fetch demo user memory.
- `POST /api/memory`: update demo user memory.
- `POST /api/assist`: compatibility route that mirrors generation behavior.

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
