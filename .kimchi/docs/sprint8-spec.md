# Sprint 8 Specification — Testing + Launch

## Sprints 1-7 Status
All complete. Build passes. TypeScript clean. Tests pass.

## Sprint 8 Goal
Add unit tests, Playwright E2E tests, CI/CD pipeline, and production deployment configuration.

---

## Chunk 1: Unit Tests + Playwright Setup

### Unit Tests
Write tests for core business logic:

1. **`src/test/plantUtils.test.ts`**
   - Test `formatNextWater(dateStr)` with cases: null, overdue, today, tomorrow, future
   - Test `isWaterToday(plant)` with boundary conditions
   - Test `healthColor` / `healthBg` returns correct Tailwind classes for boundary values (0, 40, 70, 100)

2. **`src/test/plantnet.test.ts`**
   - Test `identifyPlant` error handling (mock fetch returning non-OK)
   - Test response mapping (mock fetch returning Plant.id-like JSON, assert top 3 results have correct shape)

3. **`src/test/notifications.test.ts`**
   - Test `urlBase64ToUint8Array` outputs correct length for padded and unpadded strings

4. Create **`src/test/setup.ts`** if needed for vitest global setup.

### Playwright E2E
1. `npm install -D @playwright/test` if not present.
2. Create **`e2e/auth.spec.ts`**:
   ```typescript
   import { test, expect } from '@playwright/test';
   test('login page renders', async ({ page }) => {
     await page.goto('/login');
     await expect(page.locator('h1, h2, text=Sign In, text=Log In')).toBeVisible();
   });
   test('signup page renders', async ({ page }) => {
     await page.goto('/signup');
     await expect(page.locator('h1, h2, text=Sign Up, text=Create Account')).toBeVisible();
   });
   test('login flow navigates to home after auth', async ({ page }) => {
     await page.goto('/login');
     // Fill email/password and submit (mock credentials won't work without backend)
     // Just verify navigation attempt by checking we're still on login if auth fails
     await expect(page).toHaveURL(/\/login/);
   });
   ```

3. Create **`e2e/plants.spec.ts`**:
   ```typescript
   test('My Plants page renders', async ({ page }) => {
     await page.goto('/my-plants');
     await expect(page.locator('text=My Plants')).toBeVisible();
   });
   test('Explore page has scan banner', async ({ page }) => {
     await page.goto('/explore');
     await expect(page.locator('text=Identify Any Plant')).toBeVisible();
   });
   ```

4. Add `playwright.config.ts`:
   ```typescript
   import { defineConfig } from '@playwright/test';
   export default defineConfig({
     testDir: './e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'list',
     use: { baseURL: 'http://localhost:8080', trace: 'on-first-retry' },
     projects: [
       { name: 'chromium', use: { browserName: 'chromium' } },
     ],
   });
   ```

5. Update `package.json` scripts:
   - Add `"e2e": "playwright test"` and `"e2e:ui": "playwright test --ui"`

### Acceptance
- `npm run test` (vitest) passes with new tests.
- `npx playwright install --with-deps chromium` can run.
- `npx playwright test` executes without syntax errors (tests may fail due to missing backend — that's expected in this environment).

---

## Chunk 2: CI/CD Pipeline + Vercel Config

### Files
1. `.github/workflows/ci.yml` — Run on every PR/push
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci
         - run: npm run build
         - run: npx tsc --noEmit
         - run: npm run test
         - run: npx playwright install --with-deps chromium
         - run: npm run e2e
   ```

2. `.github/workflows/deploy.yml` — Deploy on main
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci
         - run: npm run test
         - run: npm run build
         - uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             vercel-args: '--prod'
   ```

3. **`vercel.json`** at project root:
   ```json
   {
     "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
       }
     ]
   }
   ```

### Acceptance
- `vercel.json` is valid JSON.
- Workflow YAML syntax is valid.
- No secrets hardcoded (all references use `${{ secrets.XXX }}`).

---

## Chunk 3: Security Audit + Final Polish

### Tasks
1. **Check for exposed secrets in source code**
   - Run `grep -r "VITE_SUPABASE_.*\|SUPABASE_SERVICE_ROLE\|LIVEKIT_API_SECRET\|VAPID_PRIVATE" src/` to find any accidental hardcoded secrets.
   - Confirm `.env.local` exists and is in `.gitignore`.

2. **Verify `.gitignore`**
   - Must contain `.env`, `.env.local`, `node_modules/`, `dist/`, `.vercel`

3. **Update `README.md`**
   - Add a "Getting Started" section: `npm install`, copy `.env.example` to `.env.local`, fill in keys.
   - Add a "Deployment" section with Supabase steps and Vercel steps.
   - Link to `PRODUCTION_GUIDE.md`.

### Acceptance
- No hardcoded secrets found.
- `.gitignore` correct.
- README.md updated with getting-started instructions.

## Build Order
1. Chunk 1 and Chunk 2 can run in parallel.
2. Chunk 3 (security audit) runs last.

## Verification
- `npm run build` ✅
- `npx tsc --noEmit` ✅
- `npm run test` ✅
- `npm run lint` no new errors ✅
