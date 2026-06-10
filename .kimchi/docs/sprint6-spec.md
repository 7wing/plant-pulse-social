# Sprint 6 Specification — AI + Notifications

## Sprint 5 Status
Build passes. TypeScript clean. Dead code removed from `LiveHostPage.tsx`. One minor `exhaustive-deps` lint warning remains in `LiveHostPage.tsx` (HostVideo component useEffect) — not blocking. Sprint 5 functionality verified.

## Sprint 6 Goal
Implement Plant.id AI plant scanning and push notification care reminders.

---

## Chunk 1: Plant.id Identification

### Files
1. `src/lib/plantnet.ts` — Identification client
2. `src/pages/ExplorePage.tsx` — Wire scan button + show result sheet
3. `src/components/PlantScanSheet.tsx` — Scan result / loading UI

### Interface
```typescript
// src/lib/plantnet.ts
export interface PlantSuggestion {
  scientificName: string;
  commonNames: string[];
  score: number;
}

export async function identifyPlant(imageFile: File): Promise<PlantSuggestion[]>
```

### Behavior
- ExplorePage "Scan" button opens a hidden file input with `capture="environment"`.
- On image select: compress image via `browser-image-compression` (max 1MB, max 1920px), then call `identifyPlant`.
- Show loading state during API call.
- On success: open a bottom sheet showing top 3 suggestions with scientific name, common names, and confidence %.
- On error: show error toast via sonner.
- `identifyPlant` sends base64 to `https://api.plant.id/v3/identification?details=common_names` with `Api-Key` header from `import.meta.env.VITE_PLANT_ID_API_KEY`.

### Acceptance
- `npm run build` passes.
- No new TypeScript errors.
- Scan button opens camera on mobile.
- Result sheet shows 3 results with confidence.

---

## Chunk 2: Push Notification Permission & Token Storage

### Files
1. `src/lib/notifications.ts`
2. `src/hooks/useAuth.ts`
3. `public/sw.js` (new)

### Behavior
- After user signs in (and profile is ensured), call `requestNotificationPermission()` from `src/lib/notifications.ts`.
- `requestNotificationPermission` checks existing `Notification.permission`. If `granted`, gets the service worker registration, subscribes via `pushManager.subscribe` with `applicationServerKey: VITE_VAPID_PUBLIC_KEY` (URL-safe base64), and upserts the JSON subscription into `push_tokens` table (columns: `user_id`, `token`, `platform: 'web'`).
- If permission is `default`, request it first via `Notification.requestPermission()`.
- Create `public/sw.js` with a minimal service worker that listens to `push` events and shows a notification using `self.registration.showNotification`.
- The service worker must also handle `activate` events with `self.clients.claim()` to ensure it works immediately.

### Acceptance
- Login triggers permission request.
- If granted, a row appears in `push_tokens` with `user_id` and `token` containing the push subscription JSON.
- If denied or unsupported, silently no-op.
- Build passes. No new lint errors.

---

## Chunk 3: Care Reminder Edge Function

### File
1. `supabase/functions/send-care-reminders/index.ts`

### Behavior
- HTTP POST endpoint (for cron trigger).
- Query `plants` where `next_water_at <= now()`. Also join `profiles` (host_id) and `push_tokens`.
- For each plant owner with tokens, send a web push notification using `npm:web-push`.
- Set VAPID details with `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and a mailto contact.
- Payload: `{ title: "{plant.nickname} needs water! 💧", body: "Time to water your {plant.species}", icon: plant.image_url, data: { url: \`/plant/{plant.id}\` } }`.
- After sending, optionally mark reminder sent to avoid duplicates? For MVP, just send. (Do not update `next_water_at` automatically—the user must log care.)
- Include proper CORS preflight handling for Supabase scheduled invocations.
- Returns `200 OK` on success or empty list.

### Server Environment Variables
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_PUBLIC_KEY`

### Acceptance
- Function compiles as Deno edge function.
- Correctly queries plants needing water.
- Sends push via `web-push`.
- Returns 200.

---

## Build Order
1. Chunk 1 (Plant ID) and Chunk 2 (Push Permission) can run **in parallel**.
2. Chunk 3 (Edge Function) runs after Chunk 2 is merged.

## Verification (final)
- `npm run build` passes
- `npx tsc --noEmit` zero errors
- `npx vitest run` passes
- `npm run lint` no new errors
