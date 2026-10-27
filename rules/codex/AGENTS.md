## Quality rules

Before you create or edit a file that matches a pattern below, read the linked rule file and follow it.
Read a rule file only when a matching file is in scope.

| Files | Rule | What it covers |
| --- | --- | --- |
| `tests/api/**/*.spec.ts` | [api-playwright-tests](.agents/rules/api-playwright-tests.md) | API test rules for Playwright + TypeScript: HTTP semantics, contract assertions, typed clients, data isolation, and flakiness prevention. |
| `{.husky,.githooks,scripts,docs/adr}/**`<br>`**/CONTRIBUTING.md`<br>`**/commitlint.config.*` | [commit-trailers](.agents/rules/commit-trailers.md) | Grammar and enforcement rules for Intent, Intent-Ref, Assisted-by and Comprehension-Attested-by commit trailers: when each is required, how they are validated, and which enforcement layer they belong in. |
| `tests/e2e/**/*.spec.ts` | [e2e-playwright](.agents/rules/e2e-playwright.md) | Playwright UI (E2E) test rules: test intent, locator strategy, waiting on UI state, network control, flake prevention, and failure diagnostics. |
| `{evals,prompts}/**`<br>`**/*.eval.{ts,js}`<br>`**/promptfooconfig.{yaml,yml,json}` | [llm-evals](.agents/rules/llm-evals.md) | Rules for LLM eval suites and prompt files: golden-case discipline, pinned determinism, cheapest-scoring-first, judge rubrics, regression gating against a baseline, and cost control. |
| `**/pages/**/*.ts` | [page-objects](.agents/rules/page-objects.md) | Page Object Model conventions for Playwright + TypeScript: structure, locators, actions, waits, and composition rules. |
| `tests/**/*.ts`<br>`**/playwright.config.{ts,js,mjs}` | [playwright-typescript](.agents/rules/playwright-typescript.md) | Playwright + TypeScript test code rules shared by UI and API suites: file layout, test structure, fixtures, test data, authentication state, and runner configuration. |
| `{.github/workflows,.github/actions}/**`<br>`.gitlab-ci.yml` | [quality-gate-workflows](.agents/rules/quality-gate-workflows.md) | Rules for CI quality gates: gate layers, no swallowed failures, soft gates expressed as soft gates, diff-scoped checks, required-check wiring, and sticky PR reporting. |
| `{tests,src}/**/*.ts` | [typescript-style](.agents/rules/typescript-style.md) | TypeScript style rules: explicit types at API boundaries, typed errors, import hygiene, and async conventions. |
