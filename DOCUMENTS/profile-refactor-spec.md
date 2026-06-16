# Profile Page Refactor Spec

## Overview
Refactor ProfilePage.tsx per plant-pulse-app-spec.md §4.8, §5.5, §5.2.

## Changes

### 1. ProfilePage.tsx Refactor

**Own profile tabs:** Posts | Saved | Badges
- Posts: own posts grid
- Saved: toggle between "Posts" and "Care Guides" sub-tabs
  - Posts: saved posts from `useSavedPosts()`
  - Care Guides: saved care guides from `useSavedGuides()`
- Badges: existing badge pills

**Other user profile tabs:** Posts | Collection | Badges
- Posts: their posts grid
- Collection: their plants via `useProfilePlants(profileId)` (read-only)
- Badges: existing

**Followers/Following counts:**
- Replace "Connections" tab entirely
- Followers count → tappable → opens FollowersList modal
- Following count → tappable → opens FollowersList modal
- Display inline in stats row

**Report/Block menu:**
- Show on other user's profile only
- Three-dot menu (⋮) in header area
- Options: "Report" and "Block"
- Report opens ReportUserSheet
- Block calls `useBlockUser()` mutation with confirmation

**Follow/Unfollow button:**
- Keep existing logic, ensure correct styling

**Desktop layout:**
- Horizontal header: avatar left, info + stats right
- Wider post/plant grid: 4-6 columns

### 2. FollowersList.tsx Component

Props:
- `userId: string` - profile to show followers/following for
- `initialTab: 'followers' | 'following'`
- `open: boolean`
- `onOpenChange: (open: boolean) => void`

Features:
- Header with Back button and tab toggle (Followers | Following)
- Search input for filtering
- List items with: Avatar, display_name, @username
- Follow/Unfollow buttons on each item (interactive)
- Uses `useFollowerList(userId)` and `useFollowingList(userId)` hooks

### 3. ReportUserSheet.tsx Component

Props:
- `userId: string` - user being reported
- `userName: string` - display name for confirmation
- `open: boolean`
- `onOpenChange: (open: boolean) => void`

Features:
- Reason selection: spam, harassment, inappropriate content, other
- Optional note textarea
- Submit calls `useCreateReport()` mutation
- On success: close sheet, show toast confirmation

### 4. Edit Profile Dialog Refactor

Update existing dialog in ProfilePage with:
- **Username field**: editable (currently display_name only)
- **Interests pill selector**: max 5 from fixed set:
  - Succulents, Cacti, Indoor, Tropicals, Propagation, Rare plants, Herbs, Bonsai
- **"Hide location on profile" checkbox**: toggle for `location_hidden` field
- **Avatar upload**: use `useUpload()` instead of URL input
  - Click avatar to trigger file input
  - Show preview after selection
  - Upload on save

### 5. Profile Queries Update

`src/queries/profile.ts`:
- Update `useUpdateProfile()` to support all new fields:
  - `username`
  - `display_name`
  - `bio`
  - `location`
  - `location_hidden`
  - `interests`
  - `avatar_url`

### 6. Follows Queries Update

`src/queries/follows.ts`:
Add new hooks:
- `useFollowerList(userId)` - returns full profile data for followers
- `useFollowingList(userId)` - returns full profile data for following

### 7. E2E Tests

`e2e/profile.spec.ts`:
- Test profile tabs (Posts/Saved/Badges for own profile)
- Test other profile tabs (Posts/Collection/Badges)
- Test followers count opens list
- Test following count opens list
- Test follow/unfollow button

## File List

**Created:**
- `src/components/FollowersList.tsx`
- `src/components/ReportUserSheet.tsx`
- `e2e/profile.spec.ts`

**Modified:**
- `src/pages/ProfilePage.tsx`
- `src/queries/profile.ts`
- `src/queries/follows.ts` (add new hooks)

## Dependencies
- Uses existing shadcn/ui components: Dialog, Sheet, Button, Input, Label, Avatar, Badge, Tabs, Toggle, Switch
- Uses existing hooks: useUpload, useFollow, useUnfollow, useBlockUser, useCreateReport
- Uses existing queries: useProfile, useSavedPosts, useSavedGuides, useProfilePlants