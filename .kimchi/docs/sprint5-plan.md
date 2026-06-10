# Sprint 5 — Live Streaming (LiveKit Integration)

## Goal
Replace the mock/stub live-streaming UI with real end-to-end LiveKit integration: hosts can go live with camera + mic, viewers can watch streams, and viewer count is tracked via Supabase Presence.

## Constraints
- Follow PRODUCTION_GUIDE.md patterns and AGENTS.md architecture strictly.
- All server state goes through TanStack Query hooks in `src/queries/`.
- LiveKit API secret must never reach the frontend — token generation in a Supabase Edge Function only.
- Use `@livekit/components-react` and `livekit-client` (already installed).
- Never fetch Supabase directly from components; always use query hooks.
- Clean up Supabase channels and LiveKit connections on unmount.
- Use the existing dark immersive UI style already present in `LiveHostPage.tsx` and `LiveViewerPage.tsx`.

## Existing State
- `live_streams` table exists in DB schema with columns: `id, host_id, title, category, thumbnail_url, viewer_count, status, stream_key, started_at, ended_at`.
- `@livekit/components-react` and `livekit-client` are in `package.json`.
- `LiveHostPage.tsx` has a polished pre-stream setup UI (title, category selector, camera/mic toggles) but is entirely static — no real streaming.
- `LiveViewerPage.tsx` has a polished viewer overlay (chat, reactions, viewer count badge) but `src` is a static image — no real video.
- No `livekit-token` edge function exists (the directory is empty).
- No query hooks exist for live streams.
- App.tsx routes `/live` directly to `LiveViewerPage` (a single mock stream). There is no stream discovery page.

---

## Chunk 1: Edge Function + Query Hooks + Discovery Page

### Files
1. `supabase/functions/livekit-token/index.ts`
2. `src/queries/liveStreams.ts`
3. `src/pages/DiscoverLivePage.tsx`

### Details

#### `supabase/functions/livekit-token/index.ts`
- Accepts POST with JSON body: `{ room_name: string, identity: string, role: 'host' | 'viewer' }`.
- Validates the request has a valid Supabase auth JWT (via `req.headers.get('authorization')`).
- Reads `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` from env.
- Reads `VITE_LIVEKIT_URL` (or `LIVEKIT_URL`) from env to return to client.
- Generates a LiveKit access token (JWT) using `jose` (`npm:jose` or `https://deno.land/x/jose`) with:
  - `sub`: identity
  - `iss`: LIVEKIT_API_KEY
  - `video.room`: room_name
  - `video.roomJoin`: true
  - `video.canPublish`: role === 'host'
  - `video.canSubscribe`: true
  - `video.canPublishData`: role === 'host'
  - TTL: 6 hours (21600 seconds)
- Returns `{ token, ws_url }`.
- Returns 401 on auth failure, 400 on missing params.

#### `src/queries/liveStreams.ts`
- `useLiveStreams()` — `useQuery` that fetches `live_streams` where `status = 'live'` joined with `profiles(host_id)` to get host username/avatar. Ordered by `started_at desc`.
- `useStream(streamId)` — `useQuery` for a single stream by id, joined with host profile.
- `useCreateStream()` — `useMutation` that inserts into `live_streams` with `{ host_id, title, category, status: 'live', started_at: new Date().toISOString(), room_name: streamId }`. Returns the created row. Invalidates `['liveStreams']`.
- `useEndStream()` — `useMutation` that updates `live_streams` setting `status: 'ended'`, `ended_at: now()`, `viewer_count: 0` for the given id. Invalidates `['liveStreams']` and `['stream', id]`.
- `useUpdateViewerCount()` — `useMutation` that patches `viewer_count` on a stream id.

Types:
```typescript
export type Stream = Database['public']['Tables']['live_streams']['Row'];
export interface StreamWithHost extends Stream {
  profiles: { username: string; avatar_url: string | null; display_name: string | null } | null;
}
```

#### `src/pages/DiscoverLivePage.tsx`
- Replaces the old `/live` route as the stream discovery page.
- Uses `useLiveStreams()` to show currently active streams.
- UI: grid/list of stream cards showing host avatar, stream title, category badge, live badge, viewer count.
- Empty state: "No one is live right now. Be the first!" with a "Go Live" CTA button.
- Clicking a card navigates to `/live/:streamId`.
- Keep the existing max-w-lg container. Use shadcn/ui `Card`, `Badge`, `Avatar`.
- Styled with Tailwind. Dark background not needed — this is a normal page (not immersive).

---

## Chunk 2: LiveHostPage (Real LiveKit)

### Files
1. `src/pages/LiveHostPage.tsx`

### Details
- Keep the existing pre-stream UI layout (title input, category selector, camera/mic toggles, top/bottom bars) but wire it to real actions.
- Add `streamId` state as a UUID (using `crypto.randomUUID()`) when entering the page — this becomes the `live_streams.id` and the LiveKit `room_name`.
- State machine:
  1. **Setup** (default): show title/category UI.
  2. **Connecting**: show loading spinner after "Go Live" is pressed.
  3. **Live**: hide setup UI, show the actual `<LiveKitRoom>` component with local camera preview. Show "End Stream" button.
- On "Go Live":
  1. Validate title is non-empty.
  2. Call `createStream.mutateAsync({ id: streamId, title, category, host_id: user.id, status: 'live', started_at: now() })`.
  3. Fetch token from edge function: POST to `${SUPABASE_URL}/functions/v1/livekit-token` with `{ room_name: streamId, identity: user.id, role: 'host' }`.
     - **Important**: Pass `Authorization: Bearer <supabase_session_access_token>` header.
  4. On success, set `token` and `wsUrl` state, transition to "Live" state.
- On "End Stream":
  1. Call `endStream.mutateAsync(streamId)`.
  2. Disconnect from LiveKit room.
  3. Navigate back to `/community` or `/live`.
- Use `<LiveKitRoom>` from `@livekit/components-react`:
  ```tsx
  <LiveKitRoom
    token={token}
    serverUrl={wsUrl}
    connect={true}
    options={{ publishDefaults: { videoCodec: 'vp8' } }}
  >
    <HostVideo />
  </LiveKitRoom>
  ```
- `HostVideo` is a small inner component that uses `useLocalParticipant` to show the camera preview, and toggles for mic/camera using `localParticipant.setCameraEnabled()` / `setMicrophoneEnabled()`.
- Keep the immersive dark overlay style. The `<VideoRenderer>` or `VideoTrack` from LiveKit should fill the screen behind the controls.

---

## Chunk 3: LiveViewerPage (Real LiveKit) + App Routing

### Files
1. `src/pages/LiveViewerPage.tsx`
2. `src/App.tsx`

### Details

#### `LiveViewerPage.tsx`
- Read `streamId` from `useParams()` (new route pattern `/live/:streamId`).
- Use `useStream(streamId)` to get stream info (host profile, title, viewer count).
- Fetch token from edge function: same as host but `role: 'viewer'`.
- Use `<LiveKitRoom>` in viewer mode:
  ```tsx
  <LiveKitRoom
    token={token}
    serverUrl={wsUrl}
    connect={true}
    options={{ publishDefaults: { videoCodec: 'vp8' } }}
  >
    <ViewerContent streamId={streamId} />
  </LiveKitRoom>
  ```
- `ViewerContent`:
  - Uses `useRemoteParticipants()` from `@livekit/components-react` to find the host participant.
  - Uses `useTracks([Track.Source.Camera])` to render the host's video with `<VideoTrack>`.
  - If host disconnects (no remote participants), show "Stream ended" overlay.
  - Keep the existing chat overlay, reaction buttons, and top bar — these can remain mock/static for now since stream chat is out of Sprint 5 scope. The core change is replacing the static `<img>` with a real LiveKit video track.
- **Viewer count via Supabase Presence**:
  - In `useEffect`, create a Supabase channel: `supabase.channel('live:' + streamId, { config: { presence: { key: user.id } } })`.
  - Subscribe and call `channel.track({ user_id: user.id, online_at: new Date().toISOString() })` when `SUBSCRIBED`.
  - Listen to `'presence'` `sync` events, count `Object.keys(channel.presenceState()).length`, and call `updateViewerCount.mutate({ id: streamId, viewer_count: count })`.
  - Clean up: `supabase.removeChannel(channel)` on unmount.
- Show real host info from `useStream` instead of hardcoded "PlantMom_Lisa".

#### `App.tsx`
- Update routes:
  - `path="/live"` → `<DiscoverLivePage />`
  - `path="/live/:streamId"` → `<LiveViewerPage />`
  - `path="/live-host"` → `<LiveHostPage />`
- Update `hideNav` array: add `"/live-host", "/live/"` — but since `/live/:streamId` is dynamic, better check with `location.pathname.startsWith('/live/')` or `matchPath('/live/:streamId', location.pathname)`.
- Import `DiscoverLivePage`.

---

## Acceptance Criteria

### Chunk 1
- [ ] Edge function exists and returns a valid LiveKit JWT with correct permissions for host and viewer roles.
- [ ] Query hooks exist in `src/queries/liveStreams.ts` with proper types.
- [ ] `DiscoverLivePage` lists active streams fetched from Supabase.
- [ ] Clicking a stream card navigates to `/live/:streamId`.
- [ ] TypeScript compiles without errors.

### Chunk 2
- [ ] `LiveHostPage` creates a `live_streams` row on "Go Live".
- [ ] Host connects to LiveKit room and publishes camera + mic.
- [ ] Camera preview is visible on screen.
- [ ] "End Stream" updates DB and disconnects.
- [ ] TypeScript compiles without errors.

### Chunk 3
- [ ] `LiveViewerPage` reads `:streamId` param and fetches stream + token.
- [ ] Viewer sees host's actual video feed via LiveKit `<VideoTrack>`.
- [ ] Supabase Presence tracks viewer count, which writes back to `live_streams.viewer_count`.
- [ ] `/live` route shows discovery page; `/live/:id` shows viewer page.
- [ ] TypeScript compiles without errors.

---

## Notes
- **Token generation library for Deno**: Use `jose` via `npm:jose` (works in Deno). Alternative: manual HMAC-SHA256 + base64url if `jose` has issues in the Edge Function runtime.
- **LiveKit environment vars**: Frontend needs `VITE_LIVEKIT_URL`. Edge function needs `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
- The chat overlay on the viewer page is kept static for this sprint. Real stream chat can be added later if needed.
- The existing mock chat, reactions, and side buttons in `LiveViewerPage` should remain visually identical to the user.
