# Auth Flow Audit

## Current State

### src/lib/supabase.ts
- Basic Supabase client creation with env vars. No auth-specific configuration.

### src/lib/auth.ts
- `signUp(email, password, username)` calls `supabase.auth.signUp()` with only `options: { data: { username } }`
- **MISSING**: `emailRedirectTo` — this is why email confirmation links lead to a weird Supabase URL instead of the app
- `signInWithGoogle()` correctly passes `redirectTo: ${window.location.origin}/auth/callback`
- `signIn()` and `signOut()` are standard

### src/hooks/useAuth.ts
- Listens to `onAuthStateChange`, manages user state, ensures profile exists
- Does NOT directly handle URL query params or hash fragments

### src/pages/AuthCallbackPage.tsx
- Handles `?code=` query param by calling `exchangeCodeForSession(code)` → navigates to `/`
- Does NOT handle `#access_token=` hash fragments (legacy implicit flow)
- Does NOT handle `?error=` query param
- Does NOT handle `?type=` query param for specific messaging

### src/App.tsx
- `/auth/callback` route exists and renders `AuthCallbackPage`

### src/pages/SignupPage.tsx
- Calls `signUp()` without any redirect configuration
- After successful signup, navigates to `/` immediately (assumes no email confirmation)

### src/pages/LoginPage.tsx
- No forgot-password / reset-password flow exists

## Issues Identified
1. `signUp` missing `emailRedirectTo` — confirmation emails redirect to default Supabase site URL
2. `AuthCallbackPage` only handles `?code=` — not robust for all auth callback scenarios
3. `SignupPage` navigates to `/` immediately after signup — should show "check your email" message when confirmation is required

## Fix Plan
1. Add `emailRedirectTo: ${window.location.origin}/auth/callback` to `signUp`
2. Enhance `AuthCallbackPage` to handle hash fragments and error params, use `getSession()` as fallback
3. Update `SignupPage` to detect when email confirmation is pending and show appropriate UI
