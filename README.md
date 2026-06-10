# PlantPal

Your personal plant care companion.

## Features

- **Authentication** — Email/password and Google OAuth via Supabase Auth
- **My Plants** — Add plants, log care (watering, fertilizing), track health
- **Social Feed** — Share posts with photos, like and comment, follow other users
- **Direct Chat** — Real-time messaging with other plant lovers
- **Live Streaming** — Go live or watch others stream plant care sessions via LiveKit
- **Plant ID** — Identify any plant by scanning its leaf with Plant.id AI
- **Push Notifications** — Care reminders via web-push (daily cron at 8 AM)
- **PWA** — Installable on desktop and mobile, offline-capable

## Tech Stack

Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Supabase + TanStack Query v5 + React Router v6 + Zustand + LiveKit + Plant.id API + web-push + vite-plugin-pwa

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in all required environment variables (see .env.example for the full list)

# Start dev server
npm run dev
```

## Environment Variables

**Frontend** (`VITE_` prefixed — safe to expose):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `VITE_PLANT_ID_API_KEY` | Plant.id API key (from admin.kindwise.com) |
| `VITE_LIVEKIT_URL` | LiveKit Cloud WebSocket URL (e.g. `wss://your-app.livekit.cloud`) |
| `VITE_VAPID_PUBLIC_KEY` | Web-push VAPID public key |

**Server-only** (Supabase Edge Functions — never expose to frontend):

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `VAPID_PRIVATE_KEY` | Web-push VAPID private key |

Generate VAPID keys: `npx web-push generate-vapid-keys`

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel.
2. Add environment variables in Vercel project settings.
3. Deploy on push to `main` (or use the deploy workflow in `.github/workflows/deploy.yml`).

### Backend (Supabase)

1. Run the full database schema in the Supabase SQL Editor (tables: `profiles`, `plants`, `care_logs`, `posts`, `likes`, `comments`, `follows`, `messages`, `conversations`, `live_streams`, `challenges`, `challenge_entries`, `push_tokens`).
2. Enable Row Level Security on every table and add policies as documented.
3. Enable Realtime on `messages` and `live_streams` tables.
4. Create storage buckets: `avatars`, `plant-images`, `post-images`, `chat-images` (private), `live-thumbnails`.
5. Deploy edge functions from `supabase/functions/`.

### Push Reminders Cron

Schedule the `send-care-reminders` edge function as a daily cron at 8 AM:

```
0 8 * * *
```

Or from the Supabase dashboard: Edge Functions → send-care-reminders → Triggers → Add trigger → Cron → `0 8 * * *`.

## Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run e2e

# TypeScript check
npx tsc --noEmit

# Lint
npm run lint
```

Install Playwright browsers: `npx playwright install --with-deps chromium`

## Project Structure

```
src/
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks (useAuth, useUpload, etc.)
├── lib/             # Utilities (supabase client, plant.id, notifications)
├── pages/           # Route-level page components
├── queries/         # TanStack Query hooks (plants, posts, profile, etc.)
├── store/           # Zustand global state store
└── test/            # Vitest unit tests

supabase/
└── functions/       # Supabase Edge Functions
    ├── livekit-token/       # Generates LiveKit room tokens
    └── send-care-reminders/ # Push notification cron

e2e/                 # Playwright E2E tests
.github/workflows/   # CI (ci.yml) and Deploy (deploy.yml) pipelines
```

For a detailed production setup guide, see [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md).