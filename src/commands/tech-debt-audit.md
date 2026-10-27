---
name: tech-debt-audit
title: Tech debt audit - test automation code review
description: "Audits automated test code for anti-patterns (fragile selectors, hardcoded waits, missing or swallowed assertions, test interdependence, CI misconfiguration, credential leaks) and produces a severity-ranked debt report with line citations, fixes, and an A-F health score. Use when reviewing a test suite or test PR, or when a suite has become slow, flaky, or hard to maintain. For repository-level debt such as skipped tests, disabled lint rules, and weakened CI gates, use the audit-quality-debt command."
agent: test-code-reviewer
inputs:
  targetPath: test file, folder, or PR diff to audit
---

# Task

If the `unslop-tests` skill is installed, load it before starting.

Audit the test code in `{{targetPath}}`. Name each anti-pattern precisely, state the harm it causes in this suite, and give a concrete fix.

If `{{targetPath}}` is empty, ask for it and stop. Never report on code you haven't opened.

## Steps

1. Detect the framework and read its config (`playwright.config.*`, `vitest.config.*`, `jest.config.*`, CI workflow) before judging timeouts, retries or parallelism. Framework defaults are not defects.
2. If the user named a focus ("selectors only", "security only"), limit the scan to it and say so in the report.
3. Scan for: timing and synchronisation, locators, assertions, isolation and shared state, duplication and structure, CI configuration (retries, `forbidOnly`, sharding), and security (secrets, committed session files, real PII).
4. For a large scope, read the files most likely to carry debt first (shared fixtures, helpers, config, the largest specs) and list the files you did not read.
5. Write the report in the reviewer's output format: summary line with counts and the A-F health score, findings sorted by severity, quick wins, then findings that need design work.

## Fix plan

End with the findings grouped by when to fix them:

- **Before the next release:** Critical findings (tests that cannot fail, exposed secrets or PII).
- **This sprint:** High findings (flakiness, order dependence, retries masking failures).
- **Debt backlog:** Medium findings, each with a rough effort.
- **Optional:** Low findings.

## Guardrails

- Report only; do not edit files. Fixes are snippets in the report.
- Cite a file and line for every finding, and only for code you opened.
- Mark findings that depend on context you don't have (for example `ignoreHTTPSErrors` for a self-signed test environment) as "check" rather than as defects.
- If the scope is a whole repository and the user wants a debt register with effort and ROI, stop and suggest the tech-debt-auditor agent instead.
