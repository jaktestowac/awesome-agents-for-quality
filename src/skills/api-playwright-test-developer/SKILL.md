---
name: api-playwright-test-developer
description: 'Writes and reviews API automation tests with Playwright Test: the request fixture and APIRequestContext, fixture-based setup and teardown, assertions on status and body, data management, and hybrid API+UI flows. Use when creating backend API tests, data-driven API coverage, API+UI hybrid workflows, or reviewing existing Playwright API suites. For schema validation against OpenAPI or breaking-change detection between spec versions, use testing-api-contracts.'
argument-hint: 'Endpoint or OpenAPI spec, expected behaviors, auth details, and any existing fixtures or helpers'
user-invocable: true
---

# API Playwright Test Developer

This skill defines the standard approach for writing and maintaining Playwright-based API tests. It is optimized for robust, repeatable automated validation of REST/GraphQL services, readable test design, and minimal flakiness.

## When to Use

- API endpoint functional testing (status, schema, body values)
- Data-driven regression coverage across all environments
- API calls that seed or clean up data for UI tests
- End-to-end test flows mixing UI and API interactions (hybrid tests)
- CI pipeline smoke tests and API health checks

## Core Principles

1. Explicit setup/teardown
    - Create test data in a custom fixture (`test.extend`) and delete it after `await use(...)`, so teardown runs even when the test fails and only tests that ask for the data pay for it. `beforeEach`/`afterEach` is fine for a single file with simple setup.
    - Never commit a test with cleanup disabled; leftover records make the next run order-dependent.
    - Avoid shared mutable state across tests to prevent flakiness.
    - Use unique identifiers in test data to avoid collisions and ensure idempotency.
2. Single responsibility per test case
    - Each test should target one behavior (e.g., 200 vs 401, field validation, paginated listing).
    - Use descriptive test titles to clarify the intent and expected outcome.
    - For complex scenarios, break down into multiple focused tests rather than one large test with many assertions.
    - When testing e2e flows, consider using `test.step` to logically group related API calls and assertions within a single test case.
3. Assertions
    - Assert the outcome: `await expect(response).toBeOK()` for any 2xx, `expect(response.status()).toBe(201)` when the exact code is the behaviour, then the fields that carry the behaviour (`toMatchObject`, exact values).
    - For eventually consistent backends, poll with `await expect.poll(async () => (await request.get(url)).status()).toBe(200)`, not a sleep or a hand-written loop.
    - Avoid brittle tests that rely on dynamic timestamps or ordering unless controlled.
    - Add descriptive messages to assertions for easier debugging.
    - Use soft assertions `expect.soft` for multiple checks in a single test without stopping at the first failure.
4. Clear data management
    - Set `baseURL` and auth headers once: `use: { baseURL, extraHTTPHeaders }` in `playwright.config.ts`, or a fixture built with `playwright.request.newContext({ baseURL, extraHTTPHeaders })` when roles need different tokens. Dispose contexts you create.
    - Use factory functions to generate test data with unique identifiers.
    - Avoid hardcoding environment-specific values in tests; use environment variables or config files.
    - For complex data setup, consider using API calls in `beforeEach` to create necessary resources instead of relying on static test data.
5. Patterns and best practices
    - Use the built-in `request` fixture for one-off calls; build an `APIRequestContext` fixture when several tests need the same authenticated client.
    - Use AAA pattern (Arrange-Act-Assert) for test structure.
    - Use builders or factories for constructing request payloads to improve readability and maintainability.
    - Use Simple Request Object Pattern to encapsulate API interactions and reduce duplication across tests.
    - Use `test.describe` to group related tests and share setup/teardown logic.

## Recommended Folder Layout

```
.
├── tests/
│   ├── api/
│   │   ├── users.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── orders.spec.ts
│   │   └── contracts.spec.ts
│   ├── e2e/
│   │   ├── signup-and-purchase.spec.ts
│   │   └── checkout-api-ui.spec.ts
│   └── fixtures/
│       ├── api-fixtures.ts
│       ├── data-fixtures.ts
│       └── auth-fixtures.ts
├── helpers/
│   ├── api-helpers.ts
│   └── schema-validators.ts
├── data/
│   └── payloads/
│       ├── create-user.json
│       ├── update-order.json
│       └── login.json
├── docs/
│   └── api-test-guidelines.md
├── .github/
│   └── workflows/
│       └── api-tests.yml
├── playwright.config.ts
└── .env.example
```

- `tests/api/`: dedicated API service tests and contract/spec tests.
- `tests/e2e/`: hybrid scenarios that combine UI and API flows.
- `tests/fixtures/`: setup data and auth fixtures for Playwright Test.
- `helpers/`: reusable request builders, response assertions, schema validators.
- `data/payloads/`: canonical test payloads to avoid inline duplication.
- `.env.example`: environment abstraction for endpoints and tokens.
- `.github/workflows/api-tests.yml`: CI pipeline orchestration with separate API test job.

## Playwright Test Example (TypeScript)

```ts
import { test, expect } from '@playwright/test';

test.describe('API: /users', () => {
  // baseURL and the Authorization header come from `use` in playwright.config.ts
  test('GET /users/:id returns the user that was created', async ({ request }) => {
    const email = `api-${Date.now()}-${test.info().workerIndex}@example.test`;
    const created = await request.post('/api/users', { data: { email, name: 'Ada' } });
    expect(created.status()).toBe(201);
    const { id } = await created.json();

    const response = await request.get(`/api/users/${id}`);

    await expect(response).toBeOK();
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toMatchObject({ id, email, name: 'Ada' });

    await request.delete(`/api/users/${id}`);
  });
});
```

The test asserts on data it created, so it would fail if the endpoint returned the wrong user or an empty body. An assertion such as `body.length >= 0` passes for any array and proves nothing.

## Common Patterns

- `request.get`, `request.post`, `request.put`, `request.delete`
- Transient 5xx: do not retry them inside tests; a retried 5xx is a defect reported as a pass. Wait for service health before the suite (a `webServer` URL or a setup project) and report 5xx as failures.
- Data-driven tests: Playwright Test has no `test.each` - loop over a test-case array instead, so each case registers as its own test:

  ```ts
  const cases = [
    { name: 'admin', role: 'admin', expectedStatus: 200 },
    { name: 'guest', role: 'guest', expectedStatus: 403 },
  ];

  for (const data of cases) {
    test(`GET /reports as ${data.name} returns ${data.expectedStatus}`, async ({ request }) => {
      const response = await request.get('/api/reports', {
        headers: { Authorization: `Bearer ${tokenFor(data.role)}` },
      });
      expect(response.status()).toBe(data.expectedStatus);
    });
  }
  ```

  See the parameterize guide: https://playwright.dev/docs/test-parameterize
- Auth token refresh helpers and failures when invalid credentials are used
- Validate headers `cache-control`, `strict-transport-security`, etc. for security tests

## Hybrid API+UI Scenario

1. Authenticate once in a setup project and save `storageState`, or call the login endpoint with `page.request`, which shares cookies with the page's browser context
2. Create the data the UI needs through the API (fast, no UI clicks)
3. Visit the protected page and assert the API-created data with web-first assertions (`await expect(locator).toHaveText(...)`)
4. Modify the resource via API, then confirm the UI reflects it (or act in the UI and confirm via API)

## Troubleshooting Guide

- 401/403: verify token scope, environment URL, and clock skew
- 404: confirm route path and version (`/v1`, `/v2`), check mock intercepts
- Timeout: check whether the endpoint is slow or hung before raising the per-request `timeout` option; a raised timeout hides a performance regression
- Flakiness: isolate side effects, use dedicated test data, run service health checks before suite

## Best Practices Checklist

- [ ] Leverage shared fixtures for base URL and authentication
- [ ] Keep request payloads small and reproducible
- [ ] Assert exact response fields and types
- [ ] Log request/response on failure with contextual messages
- [ ] Use `test.step` for complex flows to improve readability
- [ ] Clean up created test data in fixture teardown (or `afterEach`)
- [ ] Regularly review and refactor tests to remove redundancy and improve clarity

## Related Skills

- `testing-api-contracts` - when responses must be validated against an OpenAPI or JSON Schema, or spec versions compared for breaking changes
- `designing-test-data` - when the test data strategy needs dedicated design
- `mocking-network-and-time` - when a UI test should stub an API instead of calling it
- `verifying-acceptance-criteria` - when API behavior must be checked against stated acceptance criteria
- `code-review-advanced` - when an existing API suite needs a structured review

## Definition of Done

This skill is complete when:

- each test targets one behavior with a descriptive title
- setup and teardown are explicit, and created data is cleaned up in fixture teardown or `afterEach`
- assertions check status, content type, and exact response fields; no assertion would pass on an empty or wrong body
- data-driven cases use the loop-over-cases pattern, not a nonexistent `test.each`
- environment-specific values come from config or environment variables, not hardcoded literals

## References

- Playwright REST API request docs: https://playwright.dev/docs/api-testing
- Parameterized tests: https://playwright.dev/docs/test-parameterize
