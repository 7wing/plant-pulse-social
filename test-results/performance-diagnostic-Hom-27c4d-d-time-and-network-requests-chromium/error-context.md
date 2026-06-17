# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance-diagnostic.spec.ts >> Home Page Performance Diagnostic >> measure initial home page load time and network requests
- Location: e2e/performance-diagnostic.spec.ts:27:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - button "Home" [ref=e5] [cursor=pointer]:
        - img [ref=e6]
        - generic [ref=e9]: Home
      - button "Explore" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
        - generic [ref=e14]: Explore
      - button "Community" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
        - generic [ref=e21]: Community
    - generic [ref=e22]:
      - button "Notifications" [ref=e23] [cursor=pointer]:
        - img [ref=e24]
      - button "Profile" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
        - generic [ref=e31]: Profile
    - generic [ref=e41]:
      - generic [ref=e42]:
        - heading "My Plants" [level=3] [ref=e43]
        - button "View all →" [ref=e44] [cursor=pointer]
      - generic [ref=e45]:
        - button "Echeveria Blue Echeveria Blue In 9 days" [ref=e46] [cursor=pointer]:
          - img "Echeveria Blue" [ref=e47]
          - generic [ref=e48]:
            - paragraph [ref=e49]: Echeveria Blue
            - generic [ref=e50]:
              - img [ref=e51]
              - generic [ref=e54]: In 9 days
        - button "Aloe Vera Aloe Vera In 16 days" [ref=e55] [cursor=pointer]:
          - img "Aloe Vera" [ref=e56]
          - generic [ref=e57]:
            - paragraph [ref=e58]: Aloe Vera
            - generic [ref=e59]:
              - img [ref=e60]
              - generic [ref=e63]: In 16 days
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { writeFileSync, mkdirSync } from 'fs';
  3   | import { join } from 'path';
  4   | 
  5   | // Ensure output dir exists
  6   | const outDir = join(process.cwd(), 'test-output');
  7   | try { mkdirSync(outDir, { recursive: true }); } catch {}
  8   | 
  9   | function log(label: string, data: unknown) {
  10  |   const text = `[${label}]\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n`;
  11  |   console.log(text);
  12  |   writeFileSync(join(outDir, `perf-${label.replace(/\s+/g, '-').toLowerCase()}.txt`), text);
  13  | }
  14  | 
  15  | const TEST_EMAIL = 'alice@plantpal.test';
  16  | const TEST_PASSWORD = 'PlantPal123!';
  17  | 
  18  | test.describe('Home Page Performance Diagnostic', () => {
  19  |   test.beforeEach(async ({ page }) => {
  20  |     await page.goto('/login');
  21  |     await page.fill('input[id="email"]', TEST_EMAIL);
  22  |     await page.fill('input[id="password"]', TEST_PASSWORD);
  23  |     await page.click('button[type="submit"]');
  24  |     await page.waitForURL('/', { timeout: 15000 });
  25  |   });
  26  | 
  27  |   test('measure initial home page load time and network requests', async ({ page }) => {
  28  |     const requests: { url: string; method: string; startTime: number; endTime?: number; status?: number; duration?: number }[] = [];
  29  | 
  30  |     page.on('request', (req) => {
  31  |       const url = req.url();
  32  |       if (url.includes('supabase') || url.includes('kjmgtctcwwqsrepoldor')) {
  33  |         requests.push({ url, method: req.method(), startTime: Date.now() });
  34  |       }
  35  |     });
  36  | 
  37  |     page.on('response', (res) => {
  38  |       const url = res.url();
  39  |       const match = requests.find(r => r.url === url && r.endTime === undefined);
  40  |       if (match) {
  41  |         match.endTime = Date.now();
  42  |         match.status = res.status();
  43  |         match.duration = match.endTime - match.startTime;
  44  |       }
  45  |     });
  46  | 
  47  |     const startTime = Date.now();
  48  |     await page.goto('/');
  49  |     await page.waitForLoadState('networkidle', { timeout: 30000 });
  50  |     const loadTime = Date.now() - startTime;
  51  |     await page.waitForTimeout(2000);
  52  | 
  53  |     log('initial-load', {
  54  |       loadTimeMs: loadTime,
  55  |       requestCount: requests.length,
  56  |       requests: requests.map(r => ({ url: r.url.split('?')[0], method: r.method, durationMs: r.duration, status: r.status })),
  57  |     });
  58  | 
  59  |     const hasGreeting = await page.locator('text=Good').first().isVisible().catch(() => false);
  60  |     log('initial-content-check', { hasGreeting });
> 61  |     expect(hasGreeting).toBeTruthy();
      |                         ^ Error: expect(received).toBeTruthy()
  62  |   });
  63  | 
  64  |   test('check if home refetches when returning from explore page', async ({ page }) => {
  65  |     // Load home first
  66  |     await page.goto('/');
  67  |     await page.waitForLoadState('networkidle');
  68  |     await page.waitForTimeout(2000);
  69  | 
  70  |     // Capture requests on return to home
  71  |     const returnRequests: { url: string; method: string }[] = [];
  72  |     const track = (req: any) => {
  73  |       const url = req.url();
  74  |       if (url.includes('supabase') || url.includes('kjmgtctcwwqsrepoldor')) {
  75  |         returnRequests.push({ url: url.split('?')[0], method: req.method() });
  76  |       }
  77  |     };
  78  |     page.on('request', track);
  79  | 
  80  |     // Home -> Explore -> Home
  81  |     const exploreStart = Date.now();
  82  |     await page.goto('/explore');
  83  |     await page.waitForLoadState('networkidle');
  84  |     const exploreTime = Date.now() - exploreStart;
  85  | 
  86  |     const returnStart = Date.now();
  87  |     await page.goto('/');
  88  |     await page.waitForLoadState('networkidle', { timeout: 15000 });
  89  |     const returnTime = Date.now() - returnStart;
  90  | 
  91  |     await page.waitForTimeout(1000);
  92  |     page.off('request', track);
  93  | 
  94  |     log('navigate-home-explore-home', {
  95  |       exploreLoadMs: exploreTime,
  96  |       returnHomeLoadMs: returnTime,
  97  |       requestCountOnReturn: returnRequests.length,
  98  |       requests: returnRequests,
  99  |     });
  100 |   });
  101 | 
  102 |   test('measure render metrics and detect re-renders', async ({ page }) => {
  103 |     await page.goto('/');
  104 |     await page.waitForLoadState('networkidle');
  105 |     await page.waitForTimeout(2000);
  106 | 
  107 |     // Count how many skeleton elements are still visible after load
  108 |     const skeletonCount = await page.locator('.animate-pulse').count();
  109 | 
  110 |     // Check for React Query devtools exposure
  111 |     const cacheInfo = await page.evaluate(() => {
  112 |       const w = window as any;
  113 |       return {
  114 |         hasReactQueryDevtools: !!w.__REACT_QUERY_DEVTOOLS__?.client,
  115 |         hasTanstackQuery: !!w.__TANSTACK_QUERY__,
  116 |         keys: Object.keys(w).filter(k => k.toLowerCase().includes('query')),
  117 |       };
  118 |     });
  119 | 
  120 |     log('render-metrics', {
  121 |       skeletonCountAfterLoad: skeletonCount,
  122 |       cacheInfo,
  123 |     });
  124 |   });
  125 | 
  126 |   test('measure care task list render complexity', async ({ page }) => {
  127 |     await page.goto('/');
  128 |     await page.waitForLoadState('networkidle');
  129 |     await page.waitForTimeout(2000);
  130 | 
  131 |     // Count task cards
  132 |     const taskCards = await page.locator('button[class*="bg-card"]').count();
  133 |     const taskSections = await page.locator('h3').count();
  134 | 
  135 |     // Check for large DOM element counts that might slow rendering
  136 |     const domInfo = await page.evaluate(() => {
  137 |       return {
  138 |         totalElements: document.querySelectorAll('*').length,
  139 |         bodyChildren: document.body.children.length,
  140 |       };
  141 |     });
  142 | 
  143 |     log('care-task-complexity', {
  144 |       taskCards,
  145 |       taskSections,
  146 |       domInfo,
  147 |     });
  148 |   });
  149 | });
  150 | 
```