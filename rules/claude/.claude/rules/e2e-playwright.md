---
paths:
  - tests/e2e/**/*.spec.ts
---

# Playwright E2E rules

Goal: UI tests that read as user journeys, fail for one reason, and behave the same locally and in CI.

Shared structure, fixtures, test data, auth state and runner config are in `playwright-typescript`; page object conventions are in `page-objects`.

## Test intent

- One test = one user journey or business outcome. Split a test that verifies several unrelated outcomes.
- Steps (`test.step`) describe what the user achieves (`Add the item to the cart`), not which element is clicked.
- Seed preconditions through the API or a fixture, then drive only the flow under test through the UI.

## Locators

- Choose in this order: `getByRole()` with `name` → `getByLabel()` / `getByPlaceholder()` → `getByText()` → `getByTestId()` for elements with no stable accessible name. CSS or XPath only when none of these can identify the element, with a comment saying why.
- Never select by layout or generated classes (`div > div:nth-child(3)`, `.css-1x2y3z`).
- Every locator resolves to exactly one element (strict mode). Narrow by scoping and filtering, not by position:

```typescript
// Good: scoped to the row that matters
const row = page.getByRole('row').filter({ hasText: 'Order #1042' });
await row.getByRole('button', { name: 'Cancel' }).click();

// Bad: breaks when the sort order changes
await page.getByRole('button', { name: 'Cancel' }).nth(2).click();
```

- Use `.first()` / `.nth()` only when position is the behaviour under test (for example "newest item is listed first"), and say so in the test.

## Waiting and assertions

- Synchronise on UI state with web-first assertions. After any action that changes the page (navigation, save, search, refresh), assert the result before the next action: `await expect(page).toHaveURL(…)`, `await expect(locator).toHaveText(…)`, `toBeEnabled()`, `toBeHidden()`.
- Never use `page.waitForTimeout()`. Never use `waitForLoadState('networkidle')` as synchronisation: background polling and analytics keep the network busy or idle independently of what the user sees.
- When the test genuinely depends on a request finishing, wait for that request: start waiting before the action, then await it:

```typescript
const saved = page.waitForResponse((res) => res.url().includes('/api/orders') && res.ok());
await page.getByRole('button', { name: 'Save' }).click();
await saved;
```

- Prefer `await expect(locator).toBeVisible()` over `await locator.waitFor()`; the assertion produces a readable failure.
- Assert content or state (`toHaveText`, `toHaveCount`, `toHaveValue`) rather than bare visibility, unless appearing is itself the expected outcome.

## Network control

- Mock third-party and non-deterministic services (payments, maps, analytics, email) with `page.route()` and `route.fulfill({ json })`, or block them with `route.abort()`. Keep your own backend real unless the test is about an error state it cannot produce on demand.
- Register routes before the action that triggers the request (before `page.goto` for requests made on load).
- Replay recorded traffic with `page.routeFromHAR()` when many endpoints must be stubbed at once.

## Flake prevention

- Fix the cause, not the symptom: no double clicks, manual retry loops, or `try/catch` around actions to swallow failures.
- Assert the page is ready (a heading or key component visible) before interacting with it after navigation.
- Raise a timeout only locally and with a reason (a known slow sandbox), never globally.
- Use `expect.poll()` or `toPass()` only for eventual consistency outside the page, with an explicit `timeout`.

## Diagnostics

- Failures must be actionable from the report alone: rely on traces (`on-first-retry`), screenshots on failure, and step titles. Video only when it helps, since it is heavy in CI.
- Add a custom message where the matcher's expected/received is not enough: `await expect(banner, 'payment confirmation').toBeVisible()`.
- Never assert on truthiness alone (`expect(await locator.isVisible()).toBeTruthy()`); it does not retry and reports nothing useful.
