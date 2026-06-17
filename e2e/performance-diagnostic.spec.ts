import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Ensure output dir exists
const outDir = join(process.cwd(), 'test-output');
try { mkdirSync(outDir, { recursive: true }); } catch {}

function log(label: string, data: unknown) {
  const text = `[${label}]\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n`;
  console.log(text);
  writeFileSync(join(outDir, `perf-${label.replace(/\s+/g, '-').toLowerCase()}.txt`), text);
}

const TEST_EMAIL = 'alice@plantpal.test';
const TEST_PASSWORD = 'PlantPal123!';

test.describe('Home Page Performance Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('measure initial home page load time and network requests', async ({ page }) => {
    const requests: { url: string; method: string; startTime: number; endTime?: number; status?: number; duration?: number }[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('supabase') || url.includes('kjmgtctcwwqsrepoldor')) {
        requests.push({ url, method: req.method(), startTime: Date.now() });
      }
    });

    page.on('response', (res) => {
      const url = res.url();
      const match = requests.find(r => r.url === url && r.endTime === undefined);
      if (match) {
        match.endTime = Date.now();
        match.status = res.status();
        match.duration = match.endTime - match.startTime;
      }
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const loadTime = Date.now() - startTime;
    await page.waitForTimeout(2000);

    log('initial-load', {
      loadTimeMs: loadTime,
      requestCount: requests.length,
      requests: requests.map(r => ({ url: r.url.split('?')[0], method: r.method, durationMs: r.duration, status: r.status })),
    });

    const hasGreeting = await page.locator('text=Good').first().isVisible().catch(() => false);
    log('initial-content-check', { hasGreeting });
    expect(hasGreeting).toBeTruthy();
  });

  test('check if home refetches when returning from explore page', async ({ page }) => {
    // Load home first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Capture requests on return to home
    const returnRequests: { url: string; method: string }[] = [];
    const track = (req: any) => {
      const url = req.url();
      if (url.includes('supabase') || url.includes('kjmgtctcwwqsrepoldor')) {
        returnRequests.push({ url: url.split('?')[0], method: req.method() });
      }
    };
    page.on('request', track);

    // Home -> Explore -> Home
    const exploreStart = Date.now();
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    const exploreTime = Date.now() - exploreStart;

    const returnStart = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    const returnTime = Date.now() - returnStart;

    await page.waitForTimeout(1000);
    page.off('request', track);

    log('navigate-home-explore-home', {
      exploreLoadMs: exploreTime,
      returnHomeLoadMs: returnTime,
      requestCountOnReturn: returnRequests.length,
      requests: returnRequests,
    });
  });

  test('measure render metrics and detect re-renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Count how many skeleton elements are still visible after load
    const skeletonCount = await page.locator('.animate-pulse').count();

    // Check for React Query devtools exposure
    const cacheInfo = await page.evaluate(() => {
      const w = window as any;
      return {
        hasReactQueryDevtools: !!w.__REACT_QUERY_DEVTOOLS__?.client,
        hasTanstackQuery: !!w.__TANSTACK_QUERY__,
        keys: Object.keys(w).filter(k => k.toLowerCase().includes('query')),
      };
    });

    log('render-metrics', {
      skeletonCountAfterLoad: skeletonCount,
      cacheInfo,
    });
  });

  test('measure care task list render complexity', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Count task cards
    const taskCards = await page.locator('button[class*="bg-card"]').count();
    const taskSections = await page.locator('h3').count();

    // Check for large DOM element counts that might slow rendering
    const domInfo = await page.evaluate(() => {
      return {
        totalElements: document.querySelectorAll('*').length,
        bodyChildren: document.body.children.length,
      };
    });

    log('care-task-complexity', {
      taskCards,
      taskSections,
      domInfo,
    });
  });
});
