# Notifications System Specification

## Overview
Build a complete Notifications system for PlantPal with:
- Full notifications page at `/notifications`
- Desktop notification bell with dropdown panel in FloatingNav
- Mobile notification navigation from CareDashboard

## Files to Create
1. `src/pages/NotificationsPage.tsx` - Full notifications page
2. `src/components/NotificationBell.tsx` - Desktop dropdown component
3. `e2e/notifications.spec.ts` - E2E tests

## Files to Modify
1. `src/components/CareDashboard.tsx` - Update bell to use real unread count + navigate
2. `src/components/FloatingNav.tsx` - Add notification bell for desktop
3. `src/App.tsx` - Add `/notifications` route

## Notification Types and Icons
| Type | Icon | Deep Link |
|------|------|-----------|
| care_reminder | 🌱 | /plant/{plant_id} |
| like | ❤️ | /community |
| comment | 💬 | /community |
| follow | 👤 | /profile/{follower_id} |
| proposal_approved | 🏆 | /community |
| proposal_rejected | ❌ | /community |
| challenge_reminder | 📅 | /community |
| event_reminder | 📅 | /community |
| badge | 🏅 | /profile |

## Grouping Logic
Group notifications by:
- **Today**: created_at is today
- **Yesterday**: created_at is yesterday
- **Earlier**: any other date

## Components

### NotificationBell.tsx
- Uses shadcn Popover component
- Shows last 5 notifications grouped (Today/Yesterday/Earlier)
- Red badge with unread count if > 0
- "View all notifications" link to /notifications
- On mobile, renders as simple button navigating to /notifications
- On desktop (md+), opens dropdown panel

### NotificationsPage.tsx
- Back button (mobile) / Header with title (desktop)
- "Mark all as read" button in top right
- Grouped notification lists with section headers
- Each notification:
  - Icon based on type
  - Title (bold if unread)
  - Message
  - Timestamp
  - Tap navigates to deep link
  - Marks as read on tap
- Empty state when no notifications

### FloatingNav.tsx
- NotificationBell component added
- Position: before Profile tab or at right end

### CareDashboard.tsx
- Bell button updated to:
  - Use `useUnreadNotificationCount()` for badge
  - Navigate to `/notifications` on tap