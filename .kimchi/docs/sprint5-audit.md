# Sprint 5 Audit Findings

## Status: Mostly Complete with Code Quality Issues

### What Exists
- **LiveKit edge function** `supabase/functions/livekit-token/index.ts` — fully implemented with JWT signing via jose
- **DiscoverLivePage** — lists active streams, Go Live button present, empty state handled
- **LiveHostPage** — setup UI, connecting overlay, LiveKitRoom integration, mic/camera toggles in live mode
- **LiveViewerPage** — LiveKit video, viewer count via Supabase Presence, host info overlay
- **Queries** `src/queries/liveStreams.ts` — useLiveStreams, useStream, useCreateStream, useEndStream, useUpdateViewerCount
- **FAB** has "Go Live" action navigating to `/live-host`

### Issues Found

1. **`src/pages/LiveHostPage.tsx` — Undefined variable references (dead code)**
   - `toggleMic()` and `toggleCamera()` reference `localParticipantRef.current`, but `localParticipantRef` is never declared in the main component scope.
   - These functions are passed as `onToggleMic` / `onToggleCamera` props to `LiveRoomContent`, but `LiveRoomContent` ignores them and uses inline `localParticipant.setMicrophoneEnabled(...)` / `localParticipant.setCameraEnabled(...)` instead.
   - **Fix:** Remove `toggleMic`/`toggleCamera` from parent. Remove `onToggleMic`/`onToggleCamera` props from `LiveRoomContent` and remove unused `micRef`/`camRef` + effect inside `LiveRoomContent`.

2. **`src/pages/LiveViewerPage.tsx` — Lint issues**
   - 3 uses of `any` via `(window as any).__addLiveReaction`
   - 1 `react-hooks/exhaustive-deps` warning on `updateViewerCount.mutate` in presence useEffect
   - **Fix:** Cast to unknown type or use a proper module augmentation. Add `updateViewerCount.mutate` to deps (it's stable).

3. **Non-critical: static chat in LiveViewerPage**
   - Chat messages are hardcoded. Real-time chat for live streams is out of Sprint 5 scope (explicitly not listed in sprint checklist), so acceptable for now.

4. **Non-critical: setup mode buttons are decorative**
   - Mic/Camera/Wifi buttons in host setup mode have no onClick handlers. Acceptable for MVP.

### Acceptance for Sprint 5
- [x] LiveKit token edge function exists and compiles
- [x] Host can create a stream, get token, connect to LiveKit
- [x] Viewer can get token, connect, and see host video
- [x] Viewer count tracked via Supabase Presence
- [x] End stream updates DB status to "ended"
- [ ] No dead/undefined variable references in live pages
- [ ] No new lint errors

## Decision
Fix items 1–2 above, confirm build + lint pass, then proceed to Sprint 6.
