---
name: migrate-tests-to-playwright
title: Migrate tests to Playwright
description: "Migrates UI tests from Cypress, Selenium, Puppeteer, or Protractor to Playwright Test while preserving what each test verifies: translates idioms instead of lines, runs both suites where possible, and reports a migration status per test. Use when moving a suite or part of one to Playwright. To restructure tests that are already in Playwright, use the refactor-to-page-objects command."
inputs:
  sourceScope: file, folder, or glob of tests to migrate
---

# Task

If the `migrating-tests-to-playwright` skill is installed, load it before starting.

Your goal is to migrate the tests in {{sourceScope}} to Playwright with `@playwright/test`, without losing what the original tests verified.

Ask only for missing essentials:

- the source scope, if not provided
- whether to migrate incrementally (both suites coexist) or replace outright
- the target location for migrated tests, if a Playwright setup does not already exist

Then do the following:

1. Inventory the source tests: what each one verifies, shared commands/helpers, custom waits, fixtures, and configuration (base URL, viewports, retries).
2. Set up or reuse Playwright scaffolding: `playwright.config.ts` with `baseURL`, `trace: 'on-first-retry'`, CI-aware `retries` and `forbidOnly`; do not duplicate an existing setup.
3. Translate idiomatically - never line-by-line:
   - selector chains and `cy.get`/`findElement` calls become user-facing locators (`getByRole`, `getByLabel`, `getByTestId` as fallback)
   - implicit waits, `cy.wait(ms)`, and `sleep` calls become web-first assertions or waits on concrete conditions
   - custom commands and helper classes become fixtures or page objects following existing project patterns
   - request stubs (`cy.intercept`) become `page.route()` mocks
   - assertions map to Playwright `expect`, preserving the exact behavior each original assertion checked
4. Run each migrated test. If it fails, fix the translation and rerun, up to 3 attempts per test; then mark it blocked with the last error and move on. Where the environment allows, run the original test too and compare what they verify.
5. Produce a migration report: per source test - migrated & passing, migrated with noted differences, or blocked (and why). List source-suite behaviors that have no Playwright equivalent and how you handled them.

# Guardrails

- Coverage parity over speed: a migrated test that silently checks less than the original is a regression, not progress.
- Do not delete source tests unless I explicitly ask; migration and cleanup are separate steps.
- Report honestly which migrated tests were executed and which could not run in this environment.
- Never use `waitForTimeout` as a translation of `cy.wait(ms)` or `sleep`, and never add retries to get a migrated test green.
