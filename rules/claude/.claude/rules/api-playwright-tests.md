---
paths:
  - tests/api/**/*.spec.ts
---

# API test rules (Playwright + TypeScript)

## Goal

Write deterministic, isolated API tests that verify:

1. HTTP semantics (status + headers when relevant),
2. contract (schema/shape),
3. critical business fields and behaviors (not the whole payload).

## Structure & readability

- Use **Arrange → Act → Assert** sections (comments or `test.step`) for clarity.
- Name tests by **behavior/outcome**, not implementation:
  - Good: `should reject checkout when cart is empty (400)`
  - Bad: `POST /checkout returns 400`
- Prefer small, focused tests. Avoid "mega tests" validating many scenarios at once.

## Requests & clients

- Do **not** duplicate fetch logic in tests.
- Use dedicated helper clients/wrappers (e.g. `OrdersApi`, `UsersApi`) around Playwright `request` / `APIRequestContext`.
- Each client call must:
  - accept typed input,
  - return typed output,
  - centralize headers (auth), baseUrl and common error handling.
- Never swallow errors. If the API returns non-2xx unexpectedly, fail with useful context (endpoint, status, response excerpt).

## Assertions (what to verify)

- Always assert **status code** and (when meaningful) **content-type**. Use `await expect(response).toBeOK()` for any 2xx, `expect(response.status()).toBe(201)` when the exact code is the contract.
- In assertion always provide a helpful message (what was expected vs what was observed).
- Use soft assertions for non-critical fields (e.g. `expect.soft(response.headers()).toHaveProperty('x-rate-limit')`).
- Assert **key business fields only** (critical invariants):
  - IDs, state/status, totals, currencies, permissions, timestamps ranges (when needed).
- Avoid full-payload snapshots. If you snapshot:
  - snapshot only stable subsets (e.g. normalized object without volatile fields).
- Arrays:
  - assert `length` (or bounds) AND at least one representative item (or specific item by id),
  - do not assume ordering unless the API guarantees it (then assert sorting explicitly).

## Test data & isolation

- Tests must be **independent** and safe to run in parallel.
- Prefer creating data via API/setup helpers; avoid relying on pre-existing shared records.
- Use unique identifiers per test run (e.g. suffix with timestamp/uuid).
- Ensure cleanup:
  - delete created resources in fixture teardown (or `afterEach`), best effort,
  - if cleanup is impossible, use dedicated tenant/namespace for test data and TTL policies.
- Never write tests that depend on "yesterday’s" data or external cron jobs.

## Environments & configuration

- Never hit production endpoints.
- Read the base URL and credentials from environment variables (the project's names, e.g. `API_BASE_URL`, `API_TOKEN`) and keep them out of logs.
- Set them once: `use.baseURL` and `use.extraHTTPHeaders` in config, or `request.newContext({ baseURL, extraHTTPHeaders })` in a fixture. Tests call relative paths.
- Fail fast with a clear error if a required variable is missing.
- Do not hardcode base URLs, tokens, user credentials, or API keys in tests.

## Security & logging

- Never print tokens or sensitive PII in logs.
- When logging responses for debugging:
  - log only small excerpts,
  - redact secrets and sensitive fields.
- Prefer attaching debug data on failure (Playwright attachments/steps) rather than spamming console.

## Reliability & flakiness

- Do not use fixed sleeps.
- If the system is **eventually consistent**, prefer polling with a bounded timeout (e.g. `expect.poll`) and:
  - add a short comment explaining _why_ eventual consistency exists,
  - point to a ticket/spec if available.
- Retry the *request* (inside `expect.poll` or `toPass`) only for endpoints that are documented as eventually consistent or asynchronous, never the whole test.
- Never "solve" flakiness by raising test retries or global timeouts. Runner retries and timeouts are set in `playwright-typescript`.

## Boundaries (what not to test here)

- Do not test third-party APIs directly. Mock/stub them at your boundary if needed.
- Avoid validating the same contract/business rule in dozens of tests-centralize repeated checks in reusable assertions/helpers.
