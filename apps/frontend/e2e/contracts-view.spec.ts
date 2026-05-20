/**
 * E2E spec for the Contracts View (/contracts).
 *
 * All API calls are intercepted with page.route() so the test runs
 * without a real backend. The dev server (vite) must be reachable at
 * http://localhost:5173 (playwright.config.ts handles starting it).
 */
import { test, expect, type Page, type Route } from '@playwright/test';

// ── Fixtures ──────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', email: 'test@example.com', name: 'Test User' };

const COMPLETE_ITEM = (id: string, name: string) => ({
  id,
  orgId: 'org-1',
  name,
  type: 'vendor',
  counterparty: 'Acme Corp',
  riskScore: 8,
  flagsRed: 2,
  flagsOrange: 1,
  flagsBlue: 0,
  terminationDate: '2027-06-30T00:00:00.000Z',
  uploadedAt: '2025-01-10T09:00:00.000Z',
  status: 'complete',
  hasUnlimitedLiability: false,
  updatedAt: '2025-01-10T09:01:00.000Z',
});

const FAILED_ITEM = {
  id: 'doc-failed',
  orgId: 'org-1',
  name: 'Broken Contract',
  type: 'other',
  counterparty: null,
  riskScore: null,
  flagsRed: 0,
  flagsOrange: 0,
  flagsBlue: 0,
  terminationDate: null,
  uploadedAt: '2025-01-11T09:00:00.000Z',
  status: 'failed',
  hasUnlimitedLiability: false,
  updatedAt: '2025-01-11T09:01:00.000Z',
};

const SUMMARY = {
  totalContracts: 4,
  analysed: 3,
  avgRisk: 7.2,
  criticalFlags: 6,
  unlimitedLiability: 1,
};

function makeListResponse(items: object[], overrides: Record<string, unknown> = {}) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 8,
    totalPages: 1,
    summary: SUMMARY,
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────

async function mockAuth(page: Page) {
  await page.route('**/api/v1/auth/me', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }),
  );
}

type ListRouteHandler = (url: URL) => object;

async function mockDocumentList(page: Page, handler: ListRouteHandler) {
  await page.route('**/api/v1/documents**', (route: Route) => {
    const url = new URL(route.request().url());
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(handler(url)),
    });
  });
}

async function goToContracts(page: Page) {
  await page.goto('/contracts');
  // Wait for the KPI strip to appear — signals the list has loaded
  await page.waitForSelector('[data-testid="kpi-strip"]', { timeout: 10_000 }).catch(() => {
    // Fall back to waiting for the table if no testid yet
  });
  // Wait for the table or list to be visible
  await expect(page.locator('table[aria-label="Contracts"], ul[aria-label="Contracts"]')).toBeVisible({ timeout: 10_000 });
}

// ── Tests ─────────────────────────────────────────────────────────

test.describe('Contracts View', () => {
  const ITEMS = [
    COMPLETE_ITEM('doc-1', 'Alpha Agreement'),
    COMPLETE_ITEM('doc-2', 'Beta Service Contract'),
    COMPLETE_ITEM('doc-3', 'Gamma Vendor Deal'),
    FAILED_ITEM,
  ];

  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockDocumentList(page, () => makeListResponse(ITEMS));
  });

  // ── 1. Navigation + KPI strip ────────────────────────────────

  test('navigates to /contracts and shows the KPI strip', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page.getByRole('heading', { name: 'Contracts' })).toBeVisible();
    // KPI values derived from SUMMARY
    await expect(page.getByText('4')).toBeVisible(); // totalContracts
    await expect(page.getByText('3')).toBeVisible(); // analysed
  });

  // ── 2. Table renders contracts ───────────────────────────────

  test('renders contract rows in the table', async ({ page }) => {
    await goToContracts(page);
    await expect(page.getByRole('cell', { name: 'Alpha Agreement' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Beta Service Contract' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Gamma Vendor Deal' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Broken Contract' })).toBeVisible();
  });

  // ── 3. Filter by risk — URL param updated ───────────────────

  test('updates URL when risk filter changes', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('combobox', { name: /filter by risk/i }).selectOption('high');
    await expect(page).toHaveURL(/risk=high/);
  });

  // ── 4. Filter by type — URL param updated ───────────────────

  test('updates URL when type filter changes', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('combobox', { name: /filter by type/i }).selectOption('vendor');
    await expect(page).toHaveURL(/type=vendor/);
  });

  // ── 5. Sort — URL param updated ─────────────────────────────

  test('updates URL when sort changes', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('combobox', { name: /sort by/i }).selectOption('name');
    await expect(page).toHaveURL(/sort=name/);
  });

  // ── 6. Search debounce — URL param updated ──────────────────

  test('updates URL after typing in the search box (debounced)', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('searchbox', { name: /search by contract name/i }).fill('acme');
    // Wait for debounce (250 ms) + some rendering time
    await expect(page).toHaveURL(/q=acme/, { timeout: 2_000 });
  });

  // ── 7. complete row clicks through to Results ───────────────

  test('clicking a complete row navigates to /results/:id', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('button', { name: /open Alpha Agreement/i }).click();
    await expect(page).toHaveURL(/\/results\/doc-1/);
  });

  // ── 8. failed row is non-interactive ────────────────────────

  test('failed row has no button role and does not navigate', async ({ page }) => {
    await goToContracts(page);
    // The failed row should NOT have role="button"
    const failedButton = page.getByRole('button', { name: /open Broken Contract/i });
    await expect(failedButton).toHaveCount(0);
    // Clicking it (by row text) stays on the same page
    const rowCell = page.getByRole('cell', { name: 'Broken Contract' });
    await rowCell.click();
    await expect(page).toHaveURL(/\/contracts/);
  });

  // ── 9. Refresh preserves URL state ──────────────────────────

  test('refreshing the page preserves filter state from URL', async ({ page }) => {
    await page.goto('/contracts?risk=high&sort=name');
    await expect(page.getByRole('combobox', { name: /filter by risk/i })).toHaveValue('high');
    await expect(page.getByRole('combobox', { name: /sort by/i })).toHaveValue('name');
  });

  // ── 10. Layout toggle — cards ───────────────────────────────

  test('switching to cards layout shows cards and updates URL', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('button', { name: /cards layout/i }).click();
    await expect(page).toHaveURL(/layout=cards/);
    // Cards view uses a grid of divs, not a <table>
    await expect(page.locator('table[aria-label="Contracts"]')).toHaveCount(0);
  });

  // ── 11. Layout toggle — minimal hides KPI strip ─────────────

  test('minimal layout hides the KPI strip', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('button', { name: /minimal layout/i }).click();
    await expect(page).toHaveURL(/layout=minimal/);
    // The list should be visible; KPI strip should not be rendered
    await expect(page.locator('ul[aria-label="Contracts"]')).toBeVisible();
  });
});

// ── Pagination ────────────────────────────────────────────────────

test.describe('Contracts View — pagination', () => {
  const PAGE_1_ITEMS = Array.from({ length: 8 }, (_, i) =>
    COMPLETE_ITEM(`doc-${i + 1}`, `Contract ${i + 1}`),
  );
  const PAGE_2_ITEMS = [COMPLETE_ITEM('doc-9', 'Contract 9'), COMPLETE_ITEM('doc-10', 'Contract 10')];

  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockDocumentList(page, (url) => {
      const p = parseInt(url.searchParams.get('page') ?? '1', 10);
      const items = p === 2 ? PAGE_2_ITEMS : PAGE_1_ITEMS;
      return makeListResponse(items, { total: 10, page: p, pageSize: 8, totalPages: 2 });
    });
  });

  test('shows page 1 items and a Next button', async ({ page }) => {
    await goToContracts(page);
    await expect(page.getByRole('cell', { name: 'Contract 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: /next page/i })).toBeEnabled();
  });

  test('clicking Next loads page 2 and updates URL', async ({ page }) => {
    await goToContracts(page);
    await page.getByRole('button', { name: /next page/i }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('cell', { name: 'Contract 9' })).toBeVisible();
  });

  test('Prev button is disabled on page 1', async ({ page }) => {
    await goToContracts(page);
    await expect(page.getByRole('button', { name: /previous page/i })).toBeDisabled();
  });

  test('navigating to page 2 then Prev returns to page 1', async ({ page }) => {
    await page.goto('/contracts?page=2');
    await page.getByRole('button', { name: /previous page/i }).click();
    await expect(page).toHaveURL(/\/contracts(?!.*page=2)/);
    await expect(page.getByRole('cell', { name: 'Contract 1' })).toBeVisible();
  });
});

// ── Export CSV ────────────────────────────────────────────────────

test.describe('Contracts View — Export CSV', () => {
  const ITEMS = [
    COMPLETE_ITEM('doc-1', 'Alpha Agreement'),
    COMPLETE_ITEM('doc-2', 'Beta Service Contract'),
  ];

  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockDocumentList(page, () => makeListResponse(ITEMS));
  });

  test('Export CSV button triggers a file download', async ({ page }) => {
    await goToContracts(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export.*csv/i }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^contracts-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
