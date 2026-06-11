# ExplorePage Audit Notes

## Issue
ExplorePage.tsx has multiple sections with hardcoded mock data that need to be replaced with real TanStack Query hooks.

## Sections Identified

### 1. Live Streams Section (Lines ~97-100)
**Current:** Hardcoded 2 LiveCard instances with static images and data
**Hook Available:** `useLiveStreams()` from `src/queries/liveStreams.ts`
**Data Mapping:**
- `StreamWithHost.thumbnail_url` → LiveCard.image
- `StreamWithHost.title` → LiveCard.title
- `StreamWithHost.profiles.username` → LiveCard.host
- `StreamWithHost.profiles.avatar_url` → LiveCard.hostAvatar
- `StreamWithHost.viewer_count` → LiveCard.viewers

### 2. Plant Directory Section (Lines ~103-110)
**Current:** 6 hardcoded PlantMiniCard instances with static plant data
**Hook Available:** `usePlants()` from `src/queries/plants.ts`
**Note:** `usePlants()` returns user's own plants. For "Popular Plants" (trending/catalog), may need a different approach.
**Data Mapping:**
- `Plant.image_url` → PlantMiniCard.image (with fallback)
- `Plant.name` → PlantMiniCard.name
- `Plant.species` → PlantMiniCard.species
- `Plant.water_frequency_days` → PlantMiniCard.waterDays
- `Plant.health_score` → PlantMiniCard.healthPercent

### 3. Communities Section (Lines ~114-126)
**Current:** Hardcoded 3 community groups with static images
**Hook Available:** None (no existing query for communities/groups)
**Decision:** Show empty state or message

### 4. Challenges Section (Lines ~130-142)
**Current:** Hardcoded 2 ChallengeCard instances
**Hook Available:** None (no existing query for challenges)
**Decision:** Show empty state

### 5. Sponsored Brands Section (Lines ~146-158)
**Current:** Hardcoded 3 sponsored brand cards (ad content)
**Hook Available:** None
**Decision:** Remove section entirely (advertising placeholder)

## Actions Required
1. Import `useLiveStreams` from queries
2. Import `usePlants` from queries
3. Replace live streams section with real data
4. Replace plant directory with real user plants
5. Replace communities with empty state
6. Replace challenges with empty state
7. Remove sponsored brands section

## Verification
```bash
grep -E 'const sample|const mock|useLiveStreams|useFeedPosts|usePlants' src/pages/ExplorePage.tsx
```
Should show only the hook imports, no hardcoded data.