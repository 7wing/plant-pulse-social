# Sprint 7 Specification — PWA + Polish

## Sprint 6 Status
Complete and approved. Build passes. TypeScript clean. Tests pass.

## Sprint 7 Goal
Convert the app to a PWA, add desktop sidebar navigation, loading skeletons, error boundaries, and polish the UX.

---

## Chunk 1: PWA Setup + Offline Page + Service Worker Merge

### Files
1. `vite.config.ts` — Install `vite-plugin-pwa`, add PWA config
2. `public/sw.js` — Add `self.__WB_MANIFEST` placeholder and keep push/notificationclick logic
3. `src/main.tsx` — Remove manual service worker registration (plugin auto-injects)
4. `src/pages/OfflinePage.tsx` — New offline fallback page

### Behavior
- `vite-plugin-pwa` installed as dev dependency.
- `vite.config.ts` adds `VitePWA()` plugin with:
  - `registerType: 'autoUpdate'`
  - `injectRegister: 'auto'`
  - `strategies: 'injectManifest'`
  - `srcDir: 'public'`, `filename: 'sw.js'`
  - `manifest` with: `name: 'PlantPal'`, `short_name: 'PlantPal'`, `theme_color: '#4caf50'`, `background_color: '#f5f7f2'`, `display: 'standalone'`, `orientation: 'portrait'`, `scope: '/'`, `start_url: '/'`
  - Icons: use existing SVG/favicon assets where possible. Create a `public/icon.svg` with a simple leaf/plant graphic if no icon exists. The manifest references the SVG with `sizes: 'any'` and also creates no-frills reused fallback.
- `public/sw.js` must contain `self.__WB_MANIFEST` on its own line (workbox injects the precache manifest here). Keep existing `push` and `notificationclick` handlers.
- `src/main.tsx`: remove the manual `navigator.serviceWorker.register('/sw.js')` block since `vite-plugin-pwa` handles registration automatically.
- Create `src/pages/OfflinePage.tsx` styled as a centered card with a leaf icon and "You're offline. Check your connection and try again." text. Register it as an offline fallback in the service worker or via workbox `offlineFallback()` plugin.

Since this project has a manual service worker already, using `injectManifest` with `public/sw.js` as source is the correct strategy. Ensure `self.__WB_MANIFEST` is present.

### Acceptance
- `npm install -D vite-plugin-pwa` completes.
- `npm run build` passes and generates a service worker in `dist/`.
- `vite-plugin-pwa` manifest is present in `dist/manifest.webmanifest`.
- `public/sw.js` contains `self.__WB_MANIFEST`.
- No manual registration in `main.tsx`.

---

## Chunk 2: Desktop Sidebar + Responsive Navigation

### Files
1. `src/components/SidebarNav.tsx` — New desktop sidebar
2. `src/App.tsx` — Conditionally render BottomNav vs SidebarNav based on viewport width

### Behavior
- Create `src/components/SidebarNav.tsx`. Use `src/hooks/use-mobile.tsx` (already exists) to detect mobile.
- On desktop (not mobile), show a left sidebar nav with the same tabs as BottomNav plus a "Live" tab.
- On mobile, keep existing `BottomNav`.
- In `App.tsx`, import `SidebarNav` and conditionally render it instead of `BottomNav` when desktop.
- Sidebar styling: `fixed left-0 top-0 h-full w-64 bg-card border-r border-border` with vertical list of nav items showing icon + label. Active item gets primary text color and left border accent.

### Acceptance
- Desktop: sidebar visible, BottomNav hidden.
- Mobile: sidebar hidden, BottomNav visible.
- All existing routes still work.

---

## Chunk 3: Loading Skeletons + Error Boundaries

### Files
1. `src/components/Skeleton.tsx` or reuse shadcn skeleton if available
2. `src/components/ErrorBoundary.tsx` — Class component with `componentDidCatch`
3. `src/App.tsx` — Wrap route content with ErrorBoundary
4. Apply skeletons across key pages:
   - `src/pages/HomePage.tsx` — skeleton for care tasks + plant cards
   - `src/pages/ExplorePage.tsx` — skeleton for live cards + plant mini cards
   - `src/pages/CommunityPage.tsx` — skeleton for post list
   - `src/pages/MyPlantsPage.tsx` — skeleton for plant grid/list
   - `src/pages/ProfilePage.tsx` — skeleton for profile header + stats

### Behavior
- Check if shadcn/ui `Skeleton` component exists. If not, create `src/components/ui/skeleton.tsx` ( Radix primitive not needed; just a CSS div with `animate-pulse bg-muted rounded` ).
- In each page, render skeleton elements matching the layout while data is loading (e.g., when `isLoading` from useQuery).
- `ErrorBoundary`: class component. On error, render a centered card with "Something went wrong" + `error.message` + "Reload" button calling `window.location.reload()`.
- Wrap `AppLayout`'s route-switch content inside `ErrorBoundary` so any page crash is caught gracefully.

### Acceptance
- Every data-fetching page shows skeleton during initial load.
- ErrorBoundary catches runtime errors and displays friendly UI.
- Build passes. TypeScript clean.

## Build Order
1. Chunk 1 (PWA) + Chunk 2 (Sidebar) can run in parallel.
2. Chunk 3 (Skeletons + Error Boundaries) depends slightly on Chunk 2 for App.tsx changes but is mostly independent.

## Verification (final)
- `npm run build` passes
- `npx tsc --noEmit` zero errors
- `npx vitest run` passes
- `npm run lint` no new errors
