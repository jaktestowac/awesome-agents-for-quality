# Playwright + TypeScript test code rules

These rules cover what every Playwright test file shares. Topic-specific rules live in their own files and are not repeated here:

- UI locators, waiting and flake prevention: `e2e-playwright` (`tests/e2e/**/*.spec.ts`)
- API requests, contract assertions and API data: `api-playwright-tests` (`tests/api/**/*.spec.ts`)
- Page object structure: `page-objects` (`**/pages/**/*.ts`)
- General TypeScript style: `typescript-style`

## Files and naming

- Put UI tests in `tests/e2e/`, API tests in `tests/api/`, auth setup in `*.setup.ts`, page objects in `pages/`, fixtures in `fixtures/`. Follow the project's existing layout when it differs.
- Name spec files `<feature-or-page>.spec.ts` (`login.spec.ts`), one file per feature or page.
- Import `test` and `expect` from the project's fixture module when one exists, otherwise from `@playwright/test`. A `test` imported straight from `@playwright/test` has none of the custom fixtures.

## Test structure

- Group a feature's tests in one `test.describe()`. Use it for shared setup, never to make tests depend on each other's order.
- Title tests by behaviour or outcome: `user can pay with a saved card`, not `payment test 3`.
- Wrap multi-stage flows in `test.step('Submit the order', …)` so the report reads as the scenario. Step titles state intent, not clicks.
- Keep Arrange → Act → Assert visible in the test body. Every test ends with at least one assertion on the outcome it names.
- Use web-first assertions (`await expect(locator).toHaveText(…)`, `await expect(page).toHaveURL(…)`) and pick the most specific matcher: `toHaveText` for exact text, `toContainText` for partial, `toHaveCount` for lists, `toMatchAriaSnapshot` for structure. `expect(await locator.textContent())` does not retry and flakes.
- Synchronise on state, never on time: no `page.waitForTimeout()` or `setTimeout` sleeps. For values that are not locators, poll with `expect.poll(() => …)` or `expect(async () => { … }).toPass()`.
- Add `try/catch` only to attach context and rethrow. Catching an assertion error and continuing hides the failure.

## Fixtures

- Share setup through fixtures (`test.extend`), not module-level variables or helpers called at the top of every test. Fixtures are lazy, compose, and run their teardown after `use()` even when the test fails.
- Put cleanup in fixture teardown rather than `afterEach`, so setup and cleanup sit next to each other.
- Never create a `page` or `context` in `beforeAll` and share it across tests; each test gets its own.
- Use `{ scope: 'worker' }` only for expensive, read-only resources (an API client, a seeded tenant).

```typescript
// fixtures/index.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
export { expect } from '@playwright/test';
```

## Test data

- Every test creates or owns the data it asserts on. Never depend on records another test created or on "whatever is in the database".
- Make data unique per test so parallel runs don't collide: suffix with `crypto.randomUUID()` or `test.info().workerIndex`.
- Build data with a factory that takes overrides (`createUser({ role: 'admin' })`) or a builder for deeply nested objects. Type the shape once (`interface User`) and reuse it in factories, API clients and page object methods.
- Seed data through the API or a fixture, not through the UI, unless the UI flow is what the test is about.
- Log generated values (or a seed) when data is random, so a failure can be reproduced.

## Authentication

- Log in once in a setup project, save `storageState`, and let test projects depend on it. Don't log in through the UI in every test.
- Keep `.auth/` (or `playwright/.auth/`) in `.gitignore`; the files hold live session tokens.
- One project per role when tests need several roles. Opt a test out with `test.use({ storageState: { cookies: [], origins: [] } })`.

```typescript
// playwright.config.ts (excerpt)
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
],
```

## Runner configuration

- `retries: process.env.CI ? 2 : 0`. Retries in CI surface flaky tests in the report; they are not a fix. A test that only passes on retry is a defect to triage, not a pass.
- `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.
- `forbidOnly: !!process.env.CI` so a stray `test.only` fails CI.
- Set `baseURL` in config (from an env var for deployed environments) and navigate with relative paths: `page.goto('/login')`. Never hard-code hosts in tests.
- Keep the default timeouts. Raise a timeout locally with `test.slow()` or a per-assertion `timeout`, with a comment saying why.
- Use `webServer` with `reuseExistingServer: !process.env.CI` when the suite starts the app itself.
