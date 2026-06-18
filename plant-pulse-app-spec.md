# Plant Pulse — Full App Specification

This document compiles everything designed so far, plus best-case designs for the previously-flagged gaps, a roles/permissions model, an admin panel, and Perenual API integration steps.

---

## 1. Navigation overview

**Mobile**
- Top bar: `My Plants` (title) — `[Collection icon]` — `[Notification icon]`
- Bottom nav: `Home | Explore | Community | Profile`
- Global FAB (`+`): expands to `Add care task / Scan plant / Add new plant / New post`

**Desktop**
- Floating top nav: `Home | Explore | Community ......... Notification | Profile`
- Home page splits into two columns: Care Tasks (main) + Collection preview (sidebar)
- Same global FAB

---

## 2. Roles & permissions

### User (default)
- Manage own plants (add, edit, delete, log care, view history)
- Manage own Care Tasks
- Post, comment, like, save, share
- Follow/unfollow other users
- Browse Explore, save care guides
- Join challenges / RSVP events
- Submit challenge/event proposals
- Report posts, comments, or users
- Block other users
- Edit own profile, manage own settings, delete own account

### Moderator
Everything a User can do, plus:
- View and act on **reported content** (posts/comments) — remove content, warn user
- Review **challenge/event proposals** — approve (schedule) or reject, with optional note to submitter
- Issue **temporary suspensions** (e.g., 24h–7 days) for policy violations
- Cannot permanently ban users or access account-deletion/billing-level controls

### Admin
Everything a Moderator can do, plus:
- Permanently **ban** or **unban** users
- Manage **moderator roles** (promote/demote users to moderator)
- Full **proposal calendar** control — schedule challenges/events for the week/month, including reordering or bumping to next month if oversubscribed
- View platform-wide stats (users, posts, reports volume)
- Manage the **curated Explore library** directly (edit/remove entries that were auto-added via API fallback, in case of bad data)

---

## 3. Viewing other users' profiles — recap

| Element | Own profile | Other user's profile |
|---|---|---|
| Top-right icon | ⚙ Settings | — |
| Action button | Edit profile | Follow / Following (tap to unfollow) |
| Tabs | `Posts \| Saved \| Badges` | `Posts \| Collection \| Badges` |
| "Saved" tab | Saved posts + saved care guides (toggle) | n/a — not shown |
| "Collection" tab | n/a — reachable via Home instead | Their plants (read-only, no Add Plant) |
| Location | Shown unless hidden in own settings | Shown unless the user hid it |
| Followers/Following counts | Tappable → list | Tappable → list |
| Report/Block | n/a | Available via ⋮ menu on their profile |

---

## 4. Pages — previously designed (recap)

### 4.1 Home
```
[ My Plants                    [Collection icon]  [Notification icon] ]
─────────────────────────────────────────────────────────────────────
Welcome back, William
2 plants · 2 healthy · 0 need care
─────────────────────────────────────────────────────────────────────
[ Care Tasks ]

  TODAY
  [ ○  Water Aloe vera        · today    💧 ]
  [ ○  Fertilize Echeveria    · today    💧 ]

  UPCOMING
  [ ○  Repot Aloe vera        · 12 days  🪴 ]

  COMPLETED
  [ ✓  Watered Echeveria  · yesterday    X ]

                                    [ + Add ▾ ]
                                      Add care task
                                      Scan plant
                                      New post
                                      Add new plant

[ Home | Explore | Community | Profile ]   ← mobile bottom nav
```
Desktop: Care Tasks (main column) + Collection preview, fills available space, "View all →" when it overflows.

Recurring tasks: completing a recurring task (water/fertilize) logs it to history AND generates the next occurrence, due N days **from completion date** (not original due date).

### 4.2 Collection
```
[ ← My Plants              [search icon]  [grid/list toggle] ]
─────────────────────────────────────────
┌──────────┐  ┌──────────┐
│ Echeveria│  │ Aloe vera│
│  89%     │  │  91%     │
│ in 12d   │  │ in 19d   │
└──────────┘  └──────────┘
```
Sort: alphabetical. No "Add plant" tile (lives in FAB only).

### 4.3 Plant Detail
```
[ ← Back ]                                    [⋮ menu: Edit / Delete / Share]

[ Plant photo ]

Aloe vera                          Care score: 91%
Aloe barbadensis miller            Based on care consistency

Next care: Watering in 19 days

─────────────────────────────────────────
Care history (last 30 days)        View all →
  ✓ Watered          · yesterday
  ✓ Fertilized       · 2 weeks ago
  ✓ Repotted         · 1 month ago

─────────────────────────────────────────
Notes & photos
  [ + Add note/photo ]
```
"Care score" = % based on on-time completion of recurring care tasks. History stored indefinitely; only last 30 days shown inline.

### 4.4 Scan Plant / Add New Plant
```
FAB → Scan plant
─────────────────────────────────────────
[ Camera / scan screen ]
        ↓
[ Result screen ]
  Photo
  Species name + common name
  Care info: light, water needs, difficulty
  [ Add to my collection ]   [ Done ]
     (jumps to Confirm plant details, pre-filled)


FAB → Add new plant
─────────────────────────────────────────
[ Confirm plant details ]
─────────────────────────────────────────
Photo: [ camera / gallery ]
Nickname: [___________]
Species: [___________]
Location: [___________]  (optional)

Care schedule
  ☑ Water       every [ 7  ] days
  ☑ Fertilize   every [ 30 ] days
  ☐ Repot       every [ 6  ] months

  + Add custom task
     Task name: [______________]
     Repeat every [ __ ] [days/weeks/months/years ▾]
     (tap + to add another; multiple allowed)

[ Save to collection ]
```

### 4.5 Add Care Task
```
FAB → Add care task
─────────────────────────────────────────
For: [ Select plant(s) ▾ ]
       ☐ All plants
       ☐ Echeveria blue
       ☐ Aloe vera

Task: [______________________]
Due: [ Today ▾ ]   or  [ pick date ]

☐ Repeat
   Repeat every [ __ ] [ days ▾ ]

[ Save ]
```
Multi-select creates one task per selected plant.

### 4.6 Explore
```
[ Explore ]
─────────────────────────────────────────
[ Search species or care guides... ]

Popular plants (curated, Supabase)
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Monstera │ │ Pothos   │ │ Snake    │
└──────────┘ └──────────┘ └──────────┘
```
Search hit in Supabase → instant result. Search miss → fallback to Plant.id + Perenual → show result → save to Supabase for next time. "Live Now" and "Scan" banner removed (covered by FAB).

### 4.7 Community
```
[ Community ]
─────────────────────────────────────────
[ Search posts, users, tags... ]

This week                      [ + Propose ]
┌─────────────────────────────────────┐
│ 🏆 Repotting Day · 3d left   [Join]  │
│ 📅 Plant Swap · Sat 2pm     [RSVP]   │
└─────────────────────────────────────┘
  (rotates - current/upcoming only, no archive)

For You | Following
─────────────────────────────────────────
[ feed: posts, photos/videos, likes, comments, share, hashtags ]
```

**Challenge detail**
```
[ ← Back ]
🏆 Repotting Day
"Repot one plant this weekend and share it!"
⏳ 3 days left              [ Join ]
   (Join → adds task to Care Tasks)
─────────────────────────────────────────
Posts tagged #RepottingDay
[ feed, filtered ]
```

**Event detail**
```
[ ← Back ]
📅 Plant Swap — Saturday Park Meetup
"Bring a cutting, take a cutting!"
🕐 Sat, June 20 · 2:00 PM
📍 Central Park (or "Virtual - link")
👥 12 going                [ RSVP ]
   (RSVP → adds reminder to Care Tasks)
─────────────────────────────────────────
Posts tagged #PlantSwapJune20
[ feed, filtered ]
```

**Propose a challenge/event**
```
[ ← Back ]
Propose a challenge or event
Type: [ Challenge ▾ / Event ]
Title: [______________________]
Description: [______________________]
Proposed time options (pick 2-3):
  Option 1: [ date/range ]
  Option 2: [ date/range ]
  [ + Add another option ]
(If Event) Location: [______________________]  or  ☐ Virtual
[ Submit proposal ]
```
Submissions land in the moderator/admin proposal queue (see §6).

**Comment bottom sheet**
```
[ feed continues above, dimmed ]
─────────────────────────────────────────
[ Post photo (smaller) ]
Carla Vine · Water propagation masterclass...

Comments
  Eli Bloom: How long does this take?
  Danny Sprout: Following this!

[ Add a comment...                    Post ]
```

### 4.8 Profile
```
[ Avatar ]  Name                [ ⚙ ] (own) / [ Follow ] (others)
            @username · 📍 Location
Bio / interests
Posts: X   Plants: X   Followers: X   Following: X
[ Posts | Saved | Badges ]   ← own (Saved = posts + care guides, toggle)
[ Posts | Collection | Badges ]   ← others
```

### 4.9 Settings
```
Account
  Edit profile details →
  Email →
  Password →

Privacy
  Show location on profile          [toggle: on]

Notifications
  Care task reminders                [toggle: on]
  Likes & comments                   [toggle: on]
  Challenges & events                [toggle: off]

Account actions
  Log out
  Delete account
```
(Help & Support, About, Blocked accounts, and full account-privacy toggle were flagged as future additions.)

---

## 5. New pages — best-case designs

### 5.1 Edit Profile
```
[ ← Back ]                                    [ Save ]

[ Avatar ]  [ Change photo ]

Name:        [______________________]
Username:    [@____________________]
Location:    [______________________]   ☐ Hide on profile
Bio:         [______________________]
             [______________________]

Interests (select up to 5):
  [ Succulents ] [ Cacti ] [ Indoor ] [ Tropicals ]
  [ Propagation ] [ Rare plants ] [ Herbs ] [ Bonsai ]
  (tap to toggle — selected pills highlighted)
```
Notes:
- "Hide on profile" mirrors the Settings location toggle — editable from either place, same underlying value.
- Interests use a fixed tag set (ties into Explore categories and Community hashtags), rather than free text, for consistency.

### 5.2 New Post
```
FAB → New post
─────────────────────────────────────────
[ ← Back ]                                    [ Post ]

[ + Add photo/video ]
  (camera roll or camera; multiple photos
   allowed, video allowed)

Caption: [______________________________]
         [______________________________]

About a plant? (optional)
  [ Select plant ▾ ]   — links post to that
  plant's profile-visible activity (optional,
  does not affect Care History)

Tags: [ #________ ]  [ + Add tag ]
       (free text, autocompletes existing tags)

Add to a challenge/event (optional)
  [ None ▾ ]
  — if an active challenge/event you've joined
    exists, selecting it auto-applies its tag
    (e.g. #RepottingDay)
```
Notes:
- "About a plant" is optional and lightweight — does **not** create a Care History entry (that only happens via Care Tasks). It's just a link/reference for context.
- Selecting a joined challenge/event auto-tags the post so it appears in that challenge's filtered feed — no need to remember the exact hashtag.

### 5.3 Notifications
```
[ ← Back ]                          [ Mark all as read ]

Today
  🌱 Reminder: Water your Aloe vera is due today
  ❤️ Carla Vine liked your post
  💬 Danny Sprout commented: "Following this!"

Yesterday
  👤 Eli Bloom started following you
  🏆 Your proposal "Repotting Day" was approved
     and scheduled for Jun 20–22

Earlier
  📅 Plant Swap (Sat 2pm) is in 3 days
  🏅 You earned the "First Propagation" badge
```
Notes:
- Categories map directly to the Settings notification toggles (care reminders, likes/comments, challenges/events).
- Tapping a notification deep-links to the relevant place (the post, the profile, the challenge detail, etc.)
- Proposal status updates appear here **and** via email (per earlier decision).

### 5.4 Care Guide Detail (Explore result)
```
[ ← Back ]                                    [ 🔖 Save ]

[ Plant photo ]

Monstera deliciosa
Common name: Swiss cheese plant

Light:      Bright, indirect
Water:      Every 7–10 days
Difficulty: Easy
Toxicity:   Toxic to pets

Description
  A few sentences of Wikipedia-sourced
  description (via Plant.id), paraphrased.

─────────────────────────────────────────
[ + Add to my collection ]
  (jumps into the "Confirm plant details"
   screen from §4.4, pre-filled)
```
Notes:
- 🔖 Save toggles this guide into the user's "Saved" tab (Profile → Saved → Care Guides).
- Data sourcing: Plant.id (species ID, description, common names) + Perenual (light/water/difficulty/toxicity) — merged, then cached in Supabase (see §7).
- If care fields are unavailable for a species, show "Care info not available yet" instead of blank fields.

### 5.5 Followers / Following list
```
[ ← Back ]                    [ Followers | Following ]

[ Search... ]

[ Avatar ] Carla Vine        @carlavine      [ Following ]
[ Avatar ] Eli Bloom          @elibloom       [ Follow ]
[ Avatar ] Danny Sprout       @dannysprout    [ Following ]
```
Notes:
- Tab toggle switches between Followers and Following lists for whoever's profile this was opened from.
- Follow/Following buttons are interactive directly from this list (no need to open each profile).
- On your own "Following" list, unfollowing here mirrors unfollowing from their profile.

### 5.6 Edit Plant
```
[ ← Back ]                                    [ Save ]

Photo: [ current photo ]  [ Change photo ]

Nickname: [ Aloe vera__________ ]
Species:  [ Aloe barbadensis____ ]  (read-only if
           originally identified via scan, or
           editable manually)
Location: [ Living room________ ]

Care schedule
  ☑ Water       every [ 7  ] days
  ☑ Fertilize   every [ 30 ] days
  ☐ Repot       every [ 6  ] months
  + custom tasks (same as Add Plant)

[ Delete plant ]   ← secondary, danger-styled
```
Same form as "Confirm plant details," pre-filled with current values. Editing the schedule adjusts future Care Tasks; past history is untouched.

### 5.7 Search results

**Collection search** (within Collection page)
```
[ Search: "alo" ]
─────────────────────────────────────────
┌──────────┐
│ Aloe vera│
│  91%     │
│ in 19d   │
└──────────┘
```
Filters the existing grid in place — no separate page.

**Explore search**
```
[ Search: "monstera" ]
─────────────────────────────────────────
Results
┌──────────┐ ┌──────────┐
│ Monstera │ │ Monstera │
│ deliciosa│ │ adansonii│
└──────────┘ └──────────┘
  → tap → Care Guide Detail (§5.4)

No results? → fallback to Plant.id/Perenual,
show result, offer "Save to library"
```

**Community search**
```
[ Search: "propagation" ]
─────────────────────────────────────────
[ Posts | Users | Tags ]

Posts matching "propagation"
  [ feed items ]

Users matching "propagation"
  [ Avatar ] Carla Vine  @carlavine

Tags matching "propagation"
  #PropagationTips (1.2k posts)
```

### 5.8 Onboarding / Sign up / Login
```
SPLASH
─────────────────────────────────────────
🌱 Plant Pulse
"Care for your plants, together"

[ Continue with Google ]
[ Continue with Apple ]
[ Sign up with email ]
[ Log in ]


SIGN UP (email path)
─────────────────────────────────────────
Name:     [______________]
Email:    [______________]
Password: [______________]
[ Create account ]


WELCOME / FIRST PLANT
─────────────────────────────────────────
"Let's add your first plant"

[ Scan plant ]   [ Add manually ]   [ Skip for now ]

→ "Scan plant" leads into Scan Plant flow (§4.4)
→ "Add manually" leads into Add New Plant flow (§4.4)
→ "Skip" → straight to Home (empty state, §5.9)


PROFILE SETUP (lightweight, optional)
─────────────────────────────────────────
Username:   [@____________]
Location:   [______________]  (optional)
Interests:  [ pill selector, same as Edit Profile ]
[ Continue ]   [ Skip ]
```
Notes:
- Social login (Google/Apple) + email covers most cases without extra design.
- First-plant prompt ties onboarding directly into the core loop immediately — avoids landing on an empty Home with nothing to do.
- Profile setup is skippable — username could default to an auto-generated handle, edited later via Edit Profile.

### 5.9 Empty states
```
Home — Care Tasks, nothing due
  "All caught up! 🌿
   No care tasks right now."
  [ + Add care task ]

Collection — no plants yet
  "Your collection is empty.
   Add your first plant to get started."
  [ + Add new plant ]   [ Scan a plant ]

Notifications — none yet
  "Nothing here yet — likes, comments,
   and reminders will show up here."

Community feed (Following tab) — not following anyone
  "You're not following anyone yet.
   Explore the For You tab to find
   plant people to follow."
  [ Go to For You ]

Saved (Profile) — nothing saved
  "Posts and care guides you save
   will show up here."

Search — no results
  "No results for '<query>'.
   Try a different search term."
```

### 5.10 Share action
```
Tap [share icon] on a post
─────────────────────────────────────────
[ Share post ]

  Share to...
  [ System share sheet — Messages, WhatsApp,
    Mail, copy link, etc. ]

  Or, in-app:
  [ Send to a follower ▾ ]
    → opens a simple DM-style picker,
      sends a link/preview of the post
```
Notes:
- External share uses the device's native share sheet (no custom UI needed).
- In-app "send to a follower" is the only new surface — a lightweight contact picker. If in-app messaging doesn't otherwise exist, this could be deferred and "Share" could launch only the system sheet for v1.

---

## 6. Admin panel

A separate, web-based interface (not part of the consumer mobile/desktop app), accessible to Moderator and Admin roles only, gated by role check on login.

### 6.1 Dashboard (landing page)
```
[ Plant Pulse — Admin ]

Pending proposals: 6     Open reports: 3     Users: 1,204

[ Proposals | Reports | Users | Library ]
```

### 6.2 Proposals queue (Moderator + Admin)
```
[ Proposals ]
─────────────────────────────────────────
Pending
  🏆 "Repotting Day" — Challenge — by @williamg
     Options: Jun 20-22 / Jun 27-29 / Jul 4-6
     [ Schedule ▾ ]  [ Reject ]  [ Reject + note ]

  📅 "Cactus Q&A" — Event — by @carlavine
     Options: Jun 25, 6pm / Jun 26, 6pm
     [ Schedule ▾ ]  [ Reject ]

Scheduled (this month)
  🏆 Repotting Day — Jun 20-22       [ Edit ] [ Cancel ]
  📅 Plant Swap — Jun 20, 2pm        [ Edit ] [ Cancel ]

  (Admin only) If the month is full:
  [ Push remaining to next month ]
```
- "Schedule ▾" picks one of the submitter's proposed time options.
- Approving/rejecting triggers an email + in-app notification to the submitter (per §5.3).

### 6.3 Reports queue (Moderator + Admin)
```
[ Reports ]
─────────────────────────────────────────
  Post by @dannysprout — reported for "spam"
    [ View post ]  [ Dismiss ]  [ Remove post ]  [ Warn user ]  [ Suspend 24h ]

  Comment by @ericc — reported for "harassment"
    [ View comment ]  [ Dismiss ]  [ Remove comment ]  [ Suspend 7d ]  (Admin: [ Ban ])
```
- Moderators: dismiss / remove content / warn / temporary suspension.
- Admins: all of the above + permanent ban, plus access to the user's full violation history.

### 6.4 Users (Admin only)
```
[ Users ]
─────────────────────────────────────────
[ Search by username/email... ]

@dannysprout — Active — 2 warnings
  [ View profile ]  [ Suspend ]  [ Ban ]  [ Make moderator ]

@ericc — Suspended until Jun 18 — 1 ban (lifted)
  [ View profile ]  [ Unsuspend ]  [ Ban ]
```

### 6.5 Library management (Admin only)
```
[ Explore Library ]
─────────────────────────────────────────
[ Search curated species... ]

Monstera deliciosa — curated (manual)        [ Edit ] [ Remove ]
Bird of Paradise — auto-added (API fallback) [ Edit ] [ Remove ] [ Mark as curated ]
```
- Lets admins review/clean entries that were auto-saved from Plant.id/Perenual fallback lookups, fix bad data, or promote them to "officially curated" status.

---

## 7. Desktop layouts

General pattern: floating top nav (`Home | Explore | Community ......... Notification | Profile`) replaces all mobile top bars/bottom navs. Pages that were single-column on mobile either gain a second column (more content visible at once) or become centered modals/dialogs over the current page (for short, focused tasks like forms).

### 7.1 Home
Already covered in §4.1 — two-column: Care Tasks (main) + Collection preview (sidebar), "View all →" once the preview overflows.

### 7.2 Collection
```
[ My Plants                                  [search icon]  [grid/list toggle] ]
─────────────────────────────────────────────────────────────────────────────
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Aloe vera│ │ Echeveria│ │ Plant 3  │ │ Plant 4  │ │ Plant 5  │
│  91%     │ │  89%     │ │  ...     │ │  ...     │ │  ...     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```
Wider grid (4-5 columns depending on screen width) instead of 2. Alphabetical sort, search/toggle stay in header row.

### 7.3 Plant Detail
```
[ ← Back ]                                              [⋮ menu: Edit / Delete / Share]

┌───────────────────┐   Aloe vera                    Care score: 91%
│                    │   Aloe barbadensis miller      Based on care consistency
│   Plant photo      │
│   (larger)         │   Next care: Watering in 19 days
│                    │
└───────────────────┘   Care history (last 30 days)        View all →
                           ✓ Watered          · yesterday
                           ✓ Fertilized       · 2 weeks ago
                           ✓ Repotted         · 1 month ago

─────────────────────────────────────────────────────────────────────────────
Notes & photos                                              [ + Add note/photo ]
```
Photo and info sit side-by-side instead of stacked; notes/photos span full width below.

### 7.4 Edit Plant
Same two-column split as Plant Detail: photo/upload on the left, form fields (nickname, species, location, care schedule, custom tasks) on the right. Appears as a centered modal over Plant Detail rather than a full page.

### 7.5 Scan Plant / Add New Plant

**Scan plant**: the camera/scan step and result screen appear as a **centered modal/dialog** over the current page. Tapping "Add to my collection" transitions the same modal into the "Confirm plant details" form. Closing the modal returns to the underlying page unchanged.

**Add new plant**: the "Confirm plant details" form appears directly as a **centered modal/dialog** over the current page, with photo/preview on the left and form fields (nickname, species, location, care schedule + custom tasks) on the right. Closing the modal returns to the underlying page unchanged.

### 7.6 Add Care Task
Same modal treatment — "For: [plant(s)]", task name, due date, repeat toggle, all in a single centered dialog over Home.

### 7.7 Explore
```
[ Explore ]                                          [ Search species or care guides... ]
─────────────────────────────────────────────────────────────────────────────
Popular plants
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Monstera │ │ Pothos   │ │ Snake    │ │ ZZ Plant │ │ Pilea    │ │ Fern     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```
Wider grid (5-6 columns), search bar moves inline next to the title.

### 7.8 Care Guide Detail
```
[ ← Back ]                                                              [ 🔖 Save ]

┌───────────────────┐   Monstera deliciosa
│                    │   Common name: Swiss cheese plant
│   Plant photo      │
│   (larger)         │   Light:      Bright, indirect
│                    │   Water:      Every 7-10 days
└───────────────────┘   Difficulty: Easy
                          Toxicity:   Toxic to pets

─────────────────────────────────────────────────────────────────────────────
Description
  (full-width paragraph below the photo/info row)

[ + Add to my collection ]
```

### 7.9 Community
```
[ Community ]                                        [ Search posts, users, tags... ]
─────────────────────────────────────────────────────────────────────────────
                                            │  This week              [ + Propose ]
For You | Following                        │  ┌─────────────────────────────┐
─────────────────────────────────────────  │  │ 🏆 Repotting Day · 3d  [Join]│
[ feed: posts, photos/videos, likes,       │  │ 📅 Plant Swap · Sat   [RSVP] │
  comments, share, hashtags ]              │  └─────────────────────────────┘
                                            │
                                            │  Trending tags
                                            │  #Monstera #PropagationTips
                                            │  #RarePlants #SpringGrowth
```
Feed remains the main (left) column; "This week" strip and trending tags move to a right sidebar instead of a horizontal strip above the feed. Comment interactions open as a **centered modal dialog** (instead of a bottom sheet) — same content: post preview, comment thread, input field.

### 7.10 Challenge / Event detail, Propose form
Same content as §4.7, presented as a centered modal/dialog over Community (with the filtered feed below the description inside the modal, scrollable), rather than a full-page navigation.

### 7.11 Profile
```
┌─────────┐  William                                              [ ⚙ ] / [ Follow ]
│ Avatar  │  @williamg · 📍 Nairobi
│         │  Plant parent since 2023 · 🌱 Succulents, Indoor plants
└─────────┘  Posts: 24   Plants: 12   Followers: 340   Following: 180

[ Posts | Saved | Badges ]   ← own        [ Posts | Collection | Badges ]   ← others
─────────────────────────────────────────────────────────────────────────────
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ post │ │ post │ │ post │ │ post │ │ post │ │ post │   (wider grid)
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```
Header becomes a horizontal row (avatar left, info + stats right) instead of stacked; content grid below gains more columns.

### 7.12 Edit Profile
Centered modal/dialog over Profile. Avatar/photo upload on the left, fields (name, username, location + hide toggle, bio, interests pills) on the right.

### 7.13 Followers / Following list
Centered modal/dialog over Profile (tab toggle for Followers/Following at top, search, scrollable list) — same content as §5.5, not a full-page navigation.

### 7.14 New Post
Centered modal/dialog, opened from the FAB anywhere in the app. Photo/video preview on the left, caption + "about a plant" + tags + challenge/event linking on the right. Posting closes the modal and returns to the current page.

### 7.15 Notifications
Instead of a full page, the **notification bell** opens a **dropdown panel** anchored under the icon in the top nav:
```
                                            [Notification ▾]
                                            ┌─────────────────────────────┐
                                            │ Today                        │
                                            │  🌱 Water Aloe vera - due today│
                                            │  ❤️ Carla Vine liked your post │
                                            │                              │
                                            │ Yesterday                    │
                                            │  👤 Eli Bloom started following│
                                            │                              │
                                            │ [ View all notifications ]   │
                                            └─────────────────────────────┘
```
"View all" opens the full list (§5.3) as a centered page/modal for longer history.

### 7.16 Search results
Collection/Explore/Community search bars show results as a **dropdown/overlay panel** beneath the search field as the user types (live results), in addition to a full results view if they press Enter — same content groupings as §5.7.

### 7.17 Settings
```
[ Settings ]
─────────────────────────────────────────────────────────────────────────────
Account          │  Edit profile details
Privacy          │  ─────────────────────────
Notifications    │  Name:     [______________]
Account actions  │  Username: [______________]
                  │  ...
                  │
                  │  [ Save ]
```
Left-hand vertical section nav (Account / Privacy / Notifications / Account actions); selected section's fields render on the right. Mobile keeps the single scrolling list from §4.9.

### 7.18 Onboarding, Empty states, Share
Unchanged from §5.8–§5.10, just rendered as centered cards/dialogs with more surrounding whitespace on larger screens — no structural differences.

### 7.19 Admin panel
The admin panel (§6) is web/desktop-first by nature. Add a persistent left sidebar for navigation between **Dashboard / Proposals / Reports / Users / Library**, with the relevant table/list rendered in the main content area — consistent with the layouts already shown in §6.1–§6.5.

---

## 8. Appendix — Adding the Perenual API

You already have `PLANT_ID_API_KEY` in `.env` for identification + descriptions. Perenual fills the gap for structured care data (watering, sunlight, difficulty).

**Step 1 — Get a Perenual API key**
- Sign up at perenual.com and generate an API key from your account dashboard.
- Add it to `.env`:
  ```
  PERENUAL_API_KEY=your_key_here
  ```

**Step 2 — Create a Supabase table for the curated library**
- Table: `plant_library`
- Suggested columns: `id`, `species_name`, `common_name`, `description`, `image_url`, `light`, `water`, `difficulty`, `toxicity`, `source` (`"curated"` or `"api_fallback"`), `created_at`.

**Step 3 — Build a single lookup function (server-side)**
On a search/identify request:
1. Query `plant_library` in Supabase for a match on `species_name` or `common_name`.
2. **If found** → return it directly. Done — no external API calls.
3. **If not found**:
   - Call Plant.id (existing key) for identification/description (if coming from a photo) or skip if you already have a species name from a text search.
   - Call Perenual's species search endpoint with the species/common name to get its Perenual `id`.
   - Call Perenual's species-details endpoint with that `id` to retrieve `watering`, `sunlight`, `care_level` (difficulty), `poisonous_to_humans`/`poisonous_to_pets` (toxicity).
   - Merge the Plant.id description fields with the Perenual care fields into one object.
   - Insert the merged record into `plant_library` with `source = "api_fallback"`.
   - Return the merged object to the frontend.

**Step 4 — Handle missing data gracefully**
- If Perenual has no match or specific fields are empty, store/display `null` for those fields.
- On the Care Guide Detail page (§5.4), show "Care info not available yet" for any missing field rather than leaving it blank or erroring.

**Step 5 — Rate limit awareness**
- Both Plant.id and Perenual free tiers have request caps — since `plant_library` is checked *first* and grows over time, your steady-state API usage should drop significantly after the first few weeks of real usage.
- Log API call counts (e.g., in a simple `api_usage` table or via your hosting provider's logs) so you can see usage trends before hitting limits, and consider a simple in-memory or Redis cache for very recent duplicate lookups (e.g., two users searching "Monstera" within the same minute, before the Supabase write completes).

**Step 6 — Admin oversight**
- Use the Library management screen (§6.5) to spot-check `api_fallback` entries periodically and fix/curate them, since auto-fetched data quality can vary by species.
