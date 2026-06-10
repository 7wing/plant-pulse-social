# Sprint 5 Code Review Report

## Item 1: Edge Function (`supabase/functions/livekit-token/index.ts`)
- **Verdict: PASS**
- Uses `Deno.serve`, validates auth via `supabase.auth.getUser(token)`, accepts correct body params, generates JWT with all required LiveKit claims via `SignJWT`, returns `{ token, ws_url }`, handles CORS preflight, and keeps `LIVEKIT_API_SECRET` server-side only.

## Item 2: Query Hooks (`src/queries/liveStreams.ts`)
- **Verdict: FAIL**
- `useUpdateViewerCount()` violates the spec by invalidating `['liveStreams']` on success. Per the spec, this mutation must NOT invalidate any queries to avoid refetch loops caused by frequent Presence sync events.
- **Fix required:** Remove the `onSuccess` callback from `useUpdateViewerCount` (lines 94–96).

## Item 3: Discover Live Page (`src/pages/DiscoverLivePage.tsx`)
- **Verdict: FAIL**
- The empty state's "Go Live" CTA calls `navigate("/live-host")`, but `navigate` is defined only inside `StreamCard`, not in `DiscoverLivePage`. This will throw a runtime ReferenceError.
- **Fix required:** Add `const navigate = useNavigate();` inside the `DiscoverLivePage` component body.

## Item 4: Live Host Page (`src/pages/LiveHostPage.tsx`)
- **Verdict: PASS**
- State machine (setup → connecting → live) is present, `streamId` uses `crypto.randomUUID()`, DB row is created, token is fetched with `Authorization: Bearer` header, `<LiveKitRoom>` renders with `video={true} audio={true}`, and local camera preview works via `<HostVideo>`. Mic/camera toggles in live mode correctly call `localParticipant.setMicrophoneEnabled` / `setCameraEnabled`. Minor issue: dead `toggleMic`/`toggleCamera` functions reference an undeclared `localParticipantRef` — can be removed. Also, `onDisconnected` and `handleEndStream` both call `endStream.mutateAsync`, leading to a redundant update when the user manually ends the stream.

## Item 5: Live Viewer Page (`src/pages/LiveViewerPage.tsx`)
- **Verdict: PASS**
- Reads `streamId` from `useParams()`, uses `useStream()`, fetches viewer token with auth header, renders `<LiveKitRoom video={false} audio={true}>`, shows host video via `<VideoTrack>`, handles loading and ended overlays, implements Supabase Presence on `live:${streamId}`, updates viewer count via mutation, and cleans up the channel on unmount. Host profile data is used for name/avatar. Existing chat/reactions UI is preserved.

## Item 6: App Routing (`src/App.tsx`)
- **Verdict: PASS**
- `/live` → `DiscoverLivePage`, `/live/:streamId` → `LiveViewerPage`, `/live-host` → `LiveHostPage`. `hideNav` correctly hides bottom nav for `/live/:streamId` via `location.pathname.startsWith("/live/")`.

## Item 7: TypeScript & Compilation
- **Verdict: PASS**
- `npx tsc --noEmit` produced no errors.

## Item 8: Security
- **Verdict: PASS**
- `LIVEKIT_API_SECRET` is never referenced in frontend code. Edge function validates Supabase auth JWT before issuing tokens. Frontend passes `Authorization: Bearer <access_token>` header on every edge-function fetch call.

---

## Overall Verdict: NEEDS_FIXES

### Fix 1: `src/queries/liveStreams.ts` — Remove invalidation from `useUpdateViewerCount`
```typescript
export function useUpdateViewerCount() {
  return useMutation({
    mutationFn: async ({ id, viewer_count }: { id: string; viewer_count: number }) => {
      const { error } = await supabase
        .from("live_streams")
        .update({ viewer_count })
        .eq("id", id);
      if (error) throw error;
    },
    // REMOVE the onSuccess block
  });
}
```

### Fix 2: `src/pages/DiscoverLivePage.tsx` — Add missing `useNavigate`
Add `const navigate = useNavigate();` inside the `DiscoverLivePage` component body before the `return` statement, so the empty-state CTA button has access to it.
