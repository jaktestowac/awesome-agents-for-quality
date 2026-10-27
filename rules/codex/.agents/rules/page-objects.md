# Page Objects / App Actions rules (Playwright + TS)

## Goal

Create stable, readable, and reusable automation primitives:

- tests express **user intent**
- page objects hide **UI details**
- failures are **diagnostic** (good errors, good waits, good locators)

## Responsibilities & boundaries

- Page Objects expose **intent-level** methods (e.g. `loginAs(user)`, `addProductToCart(name)`), not low-level `click()` chains.
- Keep locators **private**. Expose actions + _key_ domain assertions only.
- Prefer a thin Page Object layer + optional **Component Objects** for reusable widgets (nav, modal, table).
- Keep test data generation, API clients and environment config out of Page Objects; they belong in fixtures and helpers.

## Constructor, typing, and state

- Accept `Page` via the constructor. Navigate with relative paths (`page.goto('/login')`) so `baseURL` comes from config.
- Store **Locator** objects, not ElementHandles (Locators are resilient to re-renders).
- Avoid storing state that can go stale across navigations (urls, text snapshots, counts). Read it when needed.

## Locators: production rules

- Follow the locator priority and strictness rules in `e2e-playwright` (`getByRole` first, CSS/XPath last, narrow by scope and filter rather than position).
- For repeated widgets, scope component locators to a root locator passed in by the page (`new OrderRow(page.getByRole('row').filter({ hasText: id }))`).

## Actions & waits

- Synchronise with auto-waiting actions and web-first `expect(...)` assertions; never `page.waitForTimeout()`. Waiting rules in full: `e2e-playwright`.
- A method that triggers navigation waits for it to complete before returning:
  - `await this.submitButton.click(); await this.page.waitForURL('**/dashboard');` (sequential, no `Promise.all` needed),
  - or assert a stable element of the new page.
- For events such as popups or downloads, start waiting before the action: `const popup = this.page.waitForEvent('popup'); await link.click(); return await popup;`.
- Readiness checks validate user-visible outcomes (URL, heading, toast, table row).

## Assertions: where they live

- Keep **minimal, meaningful** assertions inside Page Objects (e.g. `expectLoggedInAs(name)`).
- Avoid dumping "test assertions" everywhere; tests still own the scenario expectations.

## Naming conventions

- Locators are `private readonly`, named in camelCase after the element they target (e.g. `submitButton`); no mandatory suffix.
- Intent methods are verbs: `open()`, `loginAs()`, `save()`, `deleteProject()`.
- Keep methods small and composable; avoid `doEverything()`.

## Error messages & diagnostics

- When asserting, add meaningful messages (what user expected vs what was observed).
- Prefer returning useful objects for chaining (e.g. `submit(): Promise<DashboardPage>`).

## Recommended structure (example)

- `open()` navigates and verifies the page is ready.
- `assertLoaded()` checks a stable landmark (heading/main container).

Example style:

- `private readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });`
- `async open(): Promise<this> { await this.page.goto('/login'); await this.assertLoaded(); return this; }`
- `async loginAs(user): Promise<DashboardPage> { ...; await expect(dashboardHeading).toBeVisible(); return new DashboardPage(this.page); }`

## Fixtures integration (preferred)

- Login/setup flows that are shared across tests should be implemented as Playwright **fixtures** (test/worker scope as appropriate), and Page Objects should be created by fixtures/factories.
