# LiveViewerPage Chat/Reactions Wiring Audit

## Issue
LiveViewerPage.tsx had hardcoded chat messages and reactions arrays that needed to be wired to real data.

## Changes Made

### 1. Created `useStreamChat` Hook (src/queries/liveStreams.ts)
**Reason:** No existing stream chat table exists in Supabase. The `messages` table is for DM conversations only (`conversation_id` based).

**Solution:** Created a Supabase Realtime Broadcast-based chat system:
- Subscribes to a channel `stream-chat:{streamId}` on mount
- Listens for `chat_message` broadcast events
- Stores messages in local state (up to 50 messages)
- Provides `sendMessage()` callback that broadcasts to all viewers

**Type Interface:**
```typescript
interface StreamChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  text: string;
  created_at: string;
}
```

### 2. Removed Hardcoded Data (LiveViewerPage.tsx)
**Removed:**
```typescript
const chatMessages = [
  { user: "PlantDad", text: "Amazing technique! 🌱", avatar: AVATAR4 },
  // ... more hardcoded messages
];
const reactions = ["❤️", "🌿", "🔥", "😍", "👏", "🌱"];
```

**Replaced with:** `const AVAILABLE_REACTIONS = ["❤️", "🌿", "🔥", "😍", "👏", "🌱"];`

### 3. Wired ChatOverlay Component
**Changes:**
- `ChatOverlay` now receives props: `messages`, `onSendMessage`, `availableReactions`
- Real messages displayed with correct avatar fallback
- Send button now functional (sends via Realtime broadcast)
- Enter key sends message
- Auto-scroll to bottom on new messages
- Reaction bar remains functional (triggers floating reactions)

## Data Flow
1. `useStreamChat(streamId, !!stream)` → subscribes to Supabase Realtime channel
2. When user types and sends → `sendMessage(text)` → broadcasts to channel
3. All viewers in the channel receive the `chat_message` event
4. Messages appear in real-time for all participants

## Verification
```bash
grep -E 'chatMessages|reactions|useMessages|useStream' src/pages/LiveViewerPage.tsx
```

**Result:**
- No more hardcoded `chatMessages` array
- No more hardcoded `reactions` array
- `useStreamChat` imported and used
- `useStream` imported and used

## TypeScript & ESLint
- `tsc --noEmit` → No errors
- `npm run lint` → No errors related to LiveViewerPage.tsx

## Notes
- Stream chat uses Supabase Realtime Broadcast (no database persistence yet)
- Messages are ephemeral - not stored in DB
- If persistence is needed, can add database writes to `sendMessage` and query existing messages on mount
- Floating reactions remain client-side only (visual feedback, no persistence)