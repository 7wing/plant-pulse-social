# PlantPal — Agent Code Instructions

You are implementing a production-ready React + Supabase app called **PlantPal** from a prototype.
Follow this guide exactly. Do not invent alternatives to the stack unless explicitly told to.

---

## Stack (do not deviate)

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + React Router v6
- **Backend:** Supabase (database, auth, storage, realtime, edge functions)
- **Data fetching:** TanStack Query v5 — use this for ALL server state, no raw useEffect fetches
- **Forms:** react-hook-form + zod
- **Global UI state:** Zustand
- **Live video:** LiveKit
- **Plant AI:** Plant.id API (plant.id) by Kindwise
- **Push notifications:** web-push + VAPID
- **Hosting:** Vercel

---

## File Structure Conventions

- Supabase client → `src/lib/supabase.ts`
- Auth helpers → `src/lib/auth.ts`
- Query hooks → `src/queries/<feature>.ts` (e.g. `plants.ts`, `posts.ts`, `profile.ts`)
- Custom hooks → `src/hooks/use<Name>.ts`
- Zustand store → `src/store/useAppStore.ts`
- Edge functions → `supabase/functions/<name>/index.ts`

---

## Database

Run the full schema SQL in Supabase's SQL editor. Tables to create:
`profiles`, `plants`, `care_logs`, `posts`, `likes`, `comments`, `follows`,
`messages`, `conversations`, `live_streams`, `challenges`, `challenge_entries`, `push_tokens`

Always enable RLS on every table. Add policies as specified in the guide:
- `profiles`: public read, owner-only update
- `plants`: owner-only all operations
- `posts`: public read, author-only insert/delete
- `messages`: conversation participants only

Generate TypeScript types after schema is set:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

---

## Authentication

- Use `src/hooks/useAuth.ts` — listens to `supabase.auth.onAuthStateChange`
- Wrap all pages except `/login` and `/signup` with `<ProtectedRoute>`
- On signup, insert a row into `profiles` immediately after `auth.signUp`
- Support email/password and Google OAuth (`signInWithOAuth`)
- `LoginPage.tsx` and `SignupPage.tsx` do not exist yet — build them with react-hook-form + zod

---

## Data Fetching Rules

- Every read = a `useQuery` hook in `src/queries/`
- Every write = a `useMutation` hook in `src/queries/`
- Always call `queryClient.invalidateQueries` on mutation success
- Use `useInfiniteQuery` for paginated feeds (20 posts per page)
- Never fetch in `useEffect` directly — always go through TanStack Query

---

## File Uploads

- Use `src/hooks/useUpload.ts` wrapping Supabase Storage
- Compress images before upload using `browser-image-compression` (max 1MB, max 1920px)
- Buckets: `avatars` (public), `plant-images` (public), `post-images` (public), `chat-images` (private), `live-thumbnails` (public)
- On mobile, use `capture="environment"` on file inputs to open camera

---

## Feature Implementation Order

Work sprint-by-sprint. Do not skip ahead.

1. **Sprint 1 — Foundation:** Supabase setup, auth, login/signup pages, protected routes, RLS
2. **Sprint 2 — Plants:** `MyPlantsPage` wired to real data, add plant, care logging, HomePage tasks
3. **Sprint 3 — Social:** Feed with infinite scroll, likes, comments, new post sheet, follow/unfollow
4. **Sprint 4 — Chat:** Real-time messages via Supabase Realtime, send messages, conversations list
5. **Sprint 5 — Live:** LiveKit integration, Go Live button, LiveKit player for viewers, presence/viewer count
6. **Sprint 6 — AI + Notifications:** Plant.id scan button, push permission flow, care reminder cron
7. **Sprint 7 — PWA + Polish:** vite-plugin-pwa, icons, offline page, loading skeletons, error boundaries
8. **Sprint 8 — Testing + Launch:** Vitest unit tests, Playwright E2E, GitHub Actions CI, Vercel deploy

---

## Real-Time

- Chat: Subscribe to `postgres_changes` INSERT on `messages` filtered by `conversation_id`
- Live viewer count: Use Supabase Presence on channel `live:<streamId>` for viewer count, LiveKit room presence for active participants
- Always clean up channels in `useEffect` return: `supabase.removeChannel(channel)`

---

## Environment Variables

Expected in `.env.local` (never commit):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PLANT_ID_API_KEY
VITE_LIVEKIT_URL
VITE_VAPID_PUBLIC_KEY
```

Server-only (Supabase Edge Functions / not VITE_ prefixed):
```
SUPABASE_SERVICE_ROLE_KEY
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
VAPID_PRIVATE_KEY
```

---

## Push Notifications

- Request permission on first login, save subscription to `push_tokens`
- Reminder logic lives in a Supabase Edge Function: `supabase/functions/send-care-reminders/index.ts`
- Schedule it as a daily cron at 8 AM: `"0 8 * * *"`
- Use `web-push` with VAPID keys (generate via `npx web-push generate-vapid-keys`)

---

## Plant Identification (Plant.id)

- API key: sign up at **admin.kindwise.com** — key is on the dashboard immediately, no approval needed
- Install: no package needed, use native `fetch`
- Endpoint: `POST https://api.plant.id/v3/identification?details=common_names`
- Send image as base64 JSON (not multipart) with `Api-Key` header
- Response gives `result.classification.suggestions[0].name` (scientific), `suggestions[0].details.common_names`, and `suggestions[0].probability` (confidence 0–1)
- Live in `src/lib/plantnet.ts`, wired to camera input in `ExplorePage` and `PlantDetailPage`
- Show top 3 results with confidence scores in a bottom sheet after scan

```typescript
// src/lib/plantnet.ts
export async function identifyPlant(imageFile: File) {
  const base64 = await fileToBase64(imageFile);

  const res = await fetch(
    'https://api.plant.id/v3/identification?details=common_names',
    {
      method: 'POST',
      headers: {
        'Api-Key': import.meta.env.VITE_PLANT_ID_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: [base64] }),
    }
  );

  const data = await res.json();
  return data.result.classification.suggestions.slice(0, 3).map((s: any) => ({
    scientificName: s.name,
    commonNames: s.details?.common_names ?? [],
    score: s.probability,
  }));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

## Live Streaming (LiveKit)

- Install: `npm install @livekit/components-react livekit-client`
- `VITE_LIVEKIT_URL` = your LiveKit Cloud WebSocket URL (e.g. `wss://your-app.livekit.cloud`)
- Token generation must happen server-side in a Supabase Edge Function — never expose `LIVEKIT_API_SECRET` to the frontend
- Host flow: request token from edge function → connect to room → publish camera/mic tracks
- Viewer flow: request token (viewer permissions) → connect to room → subscribe to host tracks
- Use `<LiveKitRoom>` and `<VideoTrack>` components from `@livekit/components-react`
- Store `room_name` (= stream id) in `live_streams` table, not a stream key

---

## Rules

- Do not use `localStorage` for server data — use TanStack Query cache
- Do not call Supabase directly in components — always go through hooks in `src/queries/`
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- Do not build a custom auth system — use Supabase Auth
- Do not use WebSockets directly — use Supabase Realtime
- Do not skip RLS policies — every table must have them before going live