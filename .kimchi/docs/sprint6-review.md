# Sprint 6 Review Report

## Checklist Verification

### 1. `identifyPlant` compresses image before base64 encoding.
- **Status**: ✅ PASS
- **Evidence**: In `src/lib/plantnet.ts`, lines 13-20: `const compressed = await imageCompression(imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, });` then `const base64 = await fileToBase64(compressed);`

### 2. `identifyPlant` calls correct Plant.id v3 endpoint with `Api-Key` header.
- **Status**: ✅ PASS
- **Evidence**: In `src/lib/plantnet.ts`, lines 23-31: fetch to `'https://api.plant.id/v3/identification?details=common_names'` with headers `{ 'Api-Key': import.meta.env.VITE_PLANT_ID_API_KEY, 'Content-Type': 'application/json', }`

### 3. Scan button in ExplorePage uses a hidden file input with `capture="environment"`.
- **Status**: ✅ PASS
- **Evidence**: In `src/pages/ExplorePage.tsx`, lines 105-110: 
  ```jsx
  <input
    type="file"
    accept="image/*"
    capture="environment"
    ref={scanInputRef}
    onChange={handleScan}
    className="hidden"
  />
  ```
  And the Scan button (lines 98-103) calls `scanInputRef.current?.click()`

### 4. PlantScanSheet displays up to 3 results with confidence, scientific name, common names.
- **Status**: ✅ PASS
- **Evidence**: In `src/components/PlantScanSheet.tsx`, lines 34-55: maps over `results` and displays scientificName, commonNames, and score as percentage. The `identifyPlant` function in plantnet.ts already limits to 3 results (line 41: `slice(0, 3)`).

### 5. Error states show user feedback (toast).
- **Status**: ✅ PASS
- **Evidence**: In `src/pages/ExplorePage.tsx`, lines 78-80: catches errors and shows `toast.error("Scan failed. Please try again.");`

### 6. `requestNotificationPermission` handles denied/default/granted states correctly.
- **Status**: ✅ PASS
- **Evidence**: In `src/lib/notifications.ts`, lines 8-18: 
  - Returns early if `Notification.permission === 'denied'`
  - Requests permission if `'default'`
  - Proceeds only if granted

### 7. `requestNotificationPermission` upserts subscription JSON into `push_tokens`.
- **Status**: ✅ PASS
- **Evidence**: In `src/lib/notifications.ts`, lines 24-26: 
  ```ts
  await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token: JSON.stringify(subscription), platform: 'web' }, { onConflict: 'user_id' })
  ```

### 8. `useAuth` calls `requestNotificationPermission` after sign-in in both initial session and auth state change.
- **Status**: ✅ PASS
- **Evidence**: In `src/hooks/useAuth.ts`:
  - Initial session (lines 18-20): calls `requestNotificationPermission(session.user.id).catch(console.error)` after ensuring profile
  - Auth state change (lines 33-35): inside `setTimeout(() => { ... requestNotificationPermission(session.user.id).catch(console.error) }, 0)` for both 'SIGNED_IN' and 'INITIAL_SESSION' events

### 9. Service worker handles `push` and `notificationclick` events.
- **Status**: ✅ PASS
- **Evidence**: In `public/sw.js`:
  - Push event listener (lines 1-13)
  - Notification click listener (lines 15-27)
  - Also has activate listener for `self.clients.claim()`

### 10. Service worker is registered in `main.tsx`.
- **Status**: ✅ PASS
- **Evidence**: In `src/main.tsx`, lines 5-8:
  ```ts
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  }
  ```

### 11. Edge function queries plants needing water (`next_water_at <= now()`).
- **Status**: ✅ PASS
- **Evidence**: In `supabase/functions/send-care-reminders/index.ts`, lines 28-32:
  ```ts
  const { data: plants, error: plantsError } = await supabase
    .from("plants")
    .select("id, nickname, species, image_url, owner_id")
    .lte("next_water_at", now); // lte means <=
  ```

### 12. Edge function loads push tokens per owner.
- **Status**: ✅ PASS
- **Evidence**: In `supabase/functions/send-care-reminders/index.ts`, lines 38-47:
  - Gets unique owner IDs from plants
  - Queries push_tokens for those owner IDs
  - Groups tokens by owner in a Map

### 13. Edge function sends notifications via web-push with VAPID details.
- **Status**: ✅ PASS
- **Evidence**: In `supabase/functions/send-care-reminders/index.ts`:
  - Lines 2-4: Sets VAPID details with `webpush.setVapidDetails`
  - Line 69: Actually sends with `webpush.sendNotification(subscription, payload)`

### 14. No `SUPABASE_SERVICE_ROLE_KEY` or `VAPID_PRIVATE_KEY` exposed to frontend.
- **Status**: ✅ PASS
- **Evidence**: 
  - These are only used in the edge function (supabase/functions/...) via `Deno.env.get()`
  - Frontend only uses VITE_ prefixed env vars: `VITE_PLANT_ID_API_KEY`, `VITE_VAPID_PUBLIC_KEY`
  - Checked `src/lib/plantnet.ts` and `src/lib/notifications.ts` - only VITE_ vars used

### 15. Build passes (`npm run build`).
- **Status**: ✅ PASS
- **Evidence**: I ran the command and it succeeded (output showed "✓ built in 9.29s")

### 16. TypeScript passes (`npx tsc --noEmit`).
- **Status**: ✅ PASS
- **Evidence**: I ran the command and it produced no output (which means no errors)

### 17. Tests pass (`npx vitest run`).
- **Status**: ✅ PASS
- **Evidence**: I ran the command and it showed "✓ src/test/example.test.ts (1 test)" and "Test Files  1 passed (1)"

## Summary

All checklist items are passing. The implementation correctly follows the Sprint 6 specification.

## Verdict

**APPROVED**

No fixes needed as all requirements are satisfied and verification passes.