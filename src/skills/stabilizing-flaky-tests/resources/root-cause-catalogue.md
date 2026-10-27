# Root-Cause Catalogue

Per class: what it looks like, what to look for in the evidence, and a before/after fix. Examples are Playwright/TypeScript; the reasoning carries over to other runners.

## Contents

1. Timing: the test races the application
2. Shared state and order dependence
3. Data collision under parallelism
4. Environment
5. External dependency
6. Time and randomness
7. Application race: the product is the bug

---

## 1. Timing: the test races the application

**Signature**: fails more often on CI or under load; "element not found", "expected X received Y" where Y is the previous state; the trace shows the read or click happening before the response arrived or the render finished.

**Evidence in the trace**: in the action timeline, the assertion or action runs before the network request it depends on completes; the DOM snapshot at the failing step shows a loading state or the old value.

```typescript
// Before: reads once, compares once, no retry
await page.getByRole('button', { name: 'Apply' }).click();
const total = await page.getByTestId('order-total').textContent();
expect(total).toBe('90.00');

// After: the web-first assertion retries until the condition holds or times out
await page.getByRole('button', { name: 'Apply' }).click();
await expect(page.getByTestId('order-total')).toHaveText('90.00');
```

```typescript
// Before: sleep, then hope
await page.getByRole('button', { name: 'Load more' }).click();
await page.waitForTimeout(2000);

// After: wait for the specific response, registered before the click
const loaded = page.waitForResponse(
  (r) => r.url().includes('/api/products') && r.request().method() === 'GET' && r.ok(),
);
await page.getByRole('button', { name: 'Load more' }).click();
await loaded;
await expect(page.getByRole('listitem')).toHaveCount(40);
```

```typescript
// Non-DOM state: poll instead of a hand-written retry loop
await expect.poll(async () => {
  const response = await request.get(`/api/orders/${id}`);
  return (await response.json()).status;
}).toBe('PAID');
```

Animations that intercept clicks: assert the end state of the transition, or disable motion (`page.emulateMedia({ reducedMotion: 'reduce' })` where the app honours it).

## 2. Shared state and order dependence

**Signature**: passes alone, fails when run after a particular test; fails in one shard grouping and not another.

**Evidence**: the failing test reads data, cookies, local storage, or a module-level variable that an earlier test wrote. Bisect: run the failing test after the first half of its predecessors, then the second half.

```typescript
// Before: one page shared by every test in the file
let page: Page;
test.beforeAll(async ({ browser }) => { page = await browser.newPage(); });

// After: each test gets a fresh context and page (the default)
test('updates the name', async ({ page }) => { /* ... */ });
```

```typescript
// Setup that needs teardown belongs in a fixture; teardown runs even when the test fails
export const test = base.extend<{ cart: Cart }>({
  cart: async ({ request }, use) => {
    const cart = await createCart(request);
    await use(cart);
    await deleteCart(request, cart.id);
  },
});
```

## 3. Data collision under parallelism

**Signature**: fails only with more than one worker or shard; "already exists", unique-constraint errors, a list containing another test's rows, a session logged out by another test using the same account.

```typescript
// Before: every worker edits the same user
await page.goto('/users/test-user/settings');

// After: each test creates what it edits
test('edits settings', async ({ page, request }, testInfo) => {
  const email = `settings-${testInfo.workerIndex}-${crypto.randomUUID()}@example.test`;
  const user = await (await request.post('/api/users', { data: { email } })).json();
  await page.goto(`/users/${user.id}/settings`);
  // ...
});
```

Per-worker accounts: a worker-scoped fixture that creates or selects an account by `testInfo.parallelIndex`. Under sharding, `parallelIndex` repeats in every shard, so add the shard identity (for example from an env var the CI job sets) to the account key.

## 4. Environment

**Signature**: CI-only, or one runner image only. Typical variables: timezone, locale, viewport and device scale, fonts, headless rendering, CPU and memory, env vars missing in CI, a `webServer` that is still starting.

Fix it in config, where every test inherits it:

```typescript
export default defineConfig({
  use: {
    timezoneId: 'Europe/Warsaw',
    locale: 'en-GB',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Resource starvation: if failures rise with worker count on CI, measure with fewer workers before buying bigger runners. Reducing workers to hide a data collision is not a fix; check class 3 first.

## 5. External dependency

**Signature**: failures cluster in time and across unrelated tests; the trace shows a slow or failed request to a host you do not own or a shared environment other teams deploy to.

Stub the boundary and keep a drift guard; `mocking-network-and-time` owns the decision and the recipes. Keep your own backend real in end-to-end tests.

## 6. Time and randomness

**Signature**: fails at midnight, on month end, around DST, in a different timezone, or only with certain generated values.

- freeze the instant and the timezone together (`page.clock`, `timezoneId`, `TZ`)
- seed generators and print the seed in the failure output
- assert on sets when order is not part of the contract

## 7. Application race: the product is the bug

**Signature**: the test does the right thing and waits correctly, and the application still produces the wrong result some of the time. Examples: a double click creates two orders; two responses arrive out of order and the older one wins; an optimistic update is not rolled back on error; a cache serves stale data after a write.

**Evidence**: the trace shows the correct user action, the correct waiting, and an incorrect application response or render. Requests in the network tab arrive in a different order between passing and failing runs.

What to do:

1. File a bug with the trace, the reproduction command, and the observed rate (`reporting-bugs`).
2. Keep the assertion exactly as strict as it was.
3. Mark the test as a known failure linked to the bug, so the suite stays truthful:

```typescript
test('second submit does not create a duplicate order', async ({ page }) => {
  test.fixme(true, 'BUG-1234: concurrent submits create two orders; see trace in the issue');
  // ...
});
```

Use `test.fail()` instead when the failure is deterministic under the reproduction and you want the run to alert when the bug is fixed (the test then passes, and `test.fail` turns that into a failure that says "remove the marker").

Do not add a wait that lets the race resolve before asserting. That converts a bug report into a test that hides the bug.
