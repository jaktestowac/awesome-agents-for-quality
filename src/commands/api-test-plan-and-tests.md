---
name: api-test-plan-and-tests
title: API test plan and test generator
description: "Creates a risk-based API test plan from an OpenAPI spec, Postman collection, or written API docs, then generates and runs a small set of example tests in the project's existing API test stack. Use when an API has little or no automated testing and you want a plan and a working starting point in one flow. For a combined web and API plan explored through the UI, use the create-test-plan command."
inputs:
  openApiPath: OpenAPI/Swagger file path or URL (optional if a Postman collection or docs are given)
  postmanCollectionPath: Postman collection file path or URL (optional)
---

# Task

Your goal is to help the user design and implement **API testing** by:
1. Creating a **risk-based API test plan**.
2. Generating **example automated tests** in the appropriate framework for the current project.

Work in the numbered phases below, and stop at each checkpoint for confirmation. If the `api-playwright-test-developer` or `testing-api-contracts` skill is installed, load it for the test-writing and contract-testing details.

If no API description is available from any of the inputs, ask for one and stop until you have it.

---

# Inputs to collect

If any of the following are missing, ask concise questions to obtain them:

1. **API description** (at least one of):
   - OpenAPI/Swagger file path (e.g. `{{openApiPath}}`) or URL.
   - Postman collection path (e.g. `{{postmanCollectionPath}}`) or URL.
   - Or a free-form textual API description.

2. **Target project context**:
   - Programming language and test framework (if known).
   - Repository path (you can infer from context, but confirm if ambiguous).
   - Preferred style: unit-level API tests (e.g. Supertest), higher-level API tests (e.g. Playwright API), or external tools (Postman/Newman).

3. **Quality goals and constraints**:
   - Main business risks or critical flows.
   - Non-functional goals (performance, security, data integrity).
   - CI environment (GitHub Actions, Azure DevOps, GitLab CI, etc.), if relevant.

Keep your questions minimal and focused; don’t block on anything that you can reasonably assume from the codebase.

---

# Phase 1 – Discover API and project stack

1. **Parse API definition**:
   - If an OpenAPI/Swagger file or URL is provided:
     - Fetch URLs with the web tools, or search and read local files.
     - Identify:
       - Base URL(s)
       - Available paths & methods
       - Schemas for requests/responses
       - Auth mechanisms (e.g. API keys, OAuth, JWT)
   - If a Postman collection is provided:
     - Inspect folders/requests, variables, and auth setup.
   - If only a textual description is available:
     - Extract endpoints, methods, parameters, and key flows from the text.

2. **Inspect the codebase to detect stack**:
   - Search the codebase to detect existing API tests or frameworks, for example:
     - Node: Playwright API, Supertest, Jest, Vitest, Mocha.
     - .NET: HttpClient + test framework.
     - Java: Rest Assured, JUnit/TestNG.
   - Prefer **reusing the project’s existing test stack** rather than introducing a new one.

3. **Summarize findings**:
   - Briefly list:
     - Detected API endpoints and groupings (e.g. Auth, Orders, Users).
     - Detected test framework(s) and runner (e.g. Jest + npm scripts).
     - Any auth and environment variables that tests must handle.

Ask user to confirm or correct the summary before proceeding to planning.

---

# Phase 2 – Design a risk-based API test plan

1. **Define scope and priorities**:
   - Classify endpoints into:
     - Tier 1 – Business critical / money flows / auth.
     - Tier 2 – Important but less risky.
     - Tier 3 – Low-risk / informational.
   - Consider:
     - Data integrity, security, and privacy risks.
     - External dependencies (third-party APIs).

2. **Design test suites**:
   - Propose the following suites with example coverage:
     - **Smoke**: 5–10 key checks that must always pass (e.g. health, login, basic CRUD happy path).
     - **Regression**: broader CRUD, edge cases, error handling, pagination, filtering, idempotency.
     - **Negative & robustness**: invalid payloads, missing/invalid auth, boundary values.
     - **Contract/schema tests**: request/response shape validation against OpenAPI or schema.
   - For each suite, list:
     - Goals
     - Representative endpoints
     - Example test ideas

3. **Non-functional and cross-cutting concerns**:
   - Mention:
     - Basic performance checks (latency thresholds).
     - Security checks (auth enforcement, sensitive fields leaks).
     - Observability (logging correlation IDs, error responses).

4. **Output**:
   - Produce a concise **API Test Plan** in markdown, including:
     - Scope, assumptions, risks, and suites.
     - Mapping from endpoints → suites.
     - Suggested execution frequencies (on PR, nightly, release).
   - Save it to `.qa/api-test-plan.md`.

Pause and let the user optionally adjust the plan. Incorporate their feedback before generating code.

---

# Phase 3 – Generate example automated tests

1. **Choose framework based on project**:
   - If existing API tests are found:
     - Match their framework and style (naming conventions, folder structure, assertions).
   - If none is found:
     - Propose a reasonable default based on language:
       - Node.js: Playwright API test or Supertest + Jest/Vitest.
       - Other stacks: pick a common, idiomatic choice and briefly justify.

2. **Select representative test cases**:
   - From the API test plan, select a small but meaningful subset:
     - 2–3 smoke tests from Tier 1 endpoints.
     - 1–2 negative tests.
     - 1 contract/schema validation example, if feasible.

3. **Generate tests**:
   - Create or extend appropriate test files using the edit tools.
   - Follow existing project patterns for:
     - Test file naming
     - Setup/teardown (fixtures, beforeAll/afterAll)
     - Base URL configuration (env vars, config files)
   - Ensure:
     - Tests are deterministic.
     - No secrets are hard-coded (use env vars/placeholders).
     - Clear, meaningful assertions.

4. **Explain how to run the tests**:
   - Search the codebase to detect relevant npm/yarn/pnpm scripts or test runners.
   - If needed, add or update a test script (with user confirmation).
   - Summarize:
     - How to install dependencies (if new).
     - Which command(s) run the new tests.

---

# Phase 4 – Run and iterate

1. **Run tests**:
   - Execute the relevant test command in the terminal.
   - Read the test output for failures.

2. **Debug and fix**:
   - For each failure:
     - Identify root cause: environment/config vs. test bug vs. app bug.
     - Prefer minimal fixes that keep tests reliable and readable.
   - Re-run, up to 3 fix attempts per test. Stop when the selected tests pass, when a failure is an app defect (report it with the request and response), or when you hit an environment limitation; report each.
   - Never make a test pass by loosening an assertion, accepting any status code, or adding retries.

3. **Summarize and hand off**:
   - Provide:
     - Final API Test Plan (link/description of where it lives if saved to a file).
     - Paths of created/updated test files.
     - Commands to run the tests locally and in CI.
     - Suggested next steps (e.g. expand coverage to more endpoints, add contract tests, add performance baseline).

---

# Style and Interaction Guidelines

- Be concise and **actionable-first**.
- Always state which **phase** you’re in and what’s next.
- Prefer integrating with the **existing stack** over introducing new tools.
- Call out trade-offs (e.g. more coverage vs. runtime cost).
- Ask for confirmation at key checkpoints:
  - After summarizing API & stack.
  - After producing the initial test plan.
  - After generating the first batch of tests.

# Guardrails

- Send requests only to APIs and environments you are authorized to test; ask which environment to use if it is not clear.
- Do not call mutating endpoints (POST, PUT, PATCH, DELETE) against production or shared data without explicit confirmation; prefer a local or test environment and create and clean up your own test data.
- No load, fuzzing, or security probing in this command.
- Never write secrets or tokens into test files, the plan, or the summary; read them from environment variables.
