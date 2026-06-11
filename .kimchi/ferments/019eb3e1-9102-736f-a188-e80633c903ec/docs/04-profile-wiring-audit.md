# ProfilePage Wiring Audit — Phase 4 Step 2

## Issue
ProfilePage.tsx has 4 hardcoded tabs (Plants, Posts, Connections, Lives) with static
image imports (`monsteraImg`, `succulentImg`, etc.) and mock data arrays.

## Hook Analysis

### usePlants() — src/queries/plants.ts
- Returns `Plant[]` (rows from `plants` table, filtered by `owner_id = current user`)
- Has `photo_url` field on each plant
- Does NOT accept a userId parameter (uses `useAuth()` internally)
- ACTION: Create `useProfilePlants(profileId)` that accepts a userId for future extensibility.
  For now, since ProfilePage shows the *current user*, `usePlants()` works directly.

### useFeedPosts() — src/queries/posts.ts
- Returns `UseInfiniteQueryResult<PostWithAuthor[]>`
- Structure: `{ pages: PostWithAuthor[][], pageParam, hasNextPage }`
- Each post has: `id`, `image_url`, `likes_count`, `comments_count`, `profiles`
- ACTION: Flatten pages and filter by `author_id === currentUser?.id`

### useFollows() — src/queries/follows.ts
- Returns `Set<string>` of following IDs for current user
- Does NOT include profile details (no username/avatar)
- ACTION: After getting IDs, fetch `profiles` rows to get usernames and avatars

### useLiveStreams() — src/queries/liveStreams.ts
- Returns `StreamWithHost[]` — array (not paginated)
- Each stream has: `id`, `title`, `thumbnail_url`, `viewer_count`, `started_at`, `profiles` (host)
- ACTION: Wire directly, map to card layout

### useProfilePlants (new helper) — src/queries/plants.ts
- Query: `supabase.from("plants").select("*").eq("owner_id", profileId).order("created_at")`
- Reuses same `Plant` type

## Changes Summary

| Tab | Before | After |
|-----|--------|-------|
| Plants | Static image array | `useProfilePlants(profile?.id)` → `photo_url` |
| Posts | Static image array + random likes | `useFeedPosts()` → flatten pages → filter by `author_id` |
| Connections | Hardcoded 8 mock users | `useFollows()` IDs → fetch `profiles` |
| Lives | 3 hardcoded stream cards | `useLiveStreams()` → `title`, `thumbnail_url`, `viewer_count` |
| Images | 8 static imports removed | — |
| Badges | Hardcoded 5-entry array | Keep static (no badges table exists yet) |

## Verification Command
```
grep -E 'monsteraImg|succulentImg|usePlants|useFeedPosts|useFollows|useLiveStreams' src/pages/ProfilePage.tsx
```
Expected: `usePlants`/`useFeedPosts`/`useFollows`/`useLiveStreams` only (no static imports).