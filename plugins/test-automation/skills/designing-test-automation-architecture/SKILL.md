---
name: designing-test-automation-architecture
description: 'Decides the target shape of an automated test suite before it grows: which behaviour is tested at which layer, folder and project structure, fixtures versus page objects versus helpers versus screenplay, test data and auth strategy, configuration across environments, tag taxonomy, and ownership, with each significant choice recorded as a decision record. Use when starting a new suite, before a migration translates its first file, when an existing suite has grown inconsistent conventions, when E2E tests are doing the job of unit or API tests, or when a team argues about page objects, folder layout, or shared test accounts. For writing up a suite that already has a settled shape, use documenting-test-suites.'
argument-hint: 'The application and its architecture, existing tests and runners, team size and ownership, environments available, and the decision that is open'
user-invocable: true
---

# Designing Test Automation Architecture

Use this skill to decide what an automated suite should look like before its first ten files decide by accident. The output is a short set of decisions, each with its reason and the alternatives rejected, plus a skeleton the team can start writing into.

Suites rarely fail because of one bad test. They fail because nobody decided where a test belongs, so every behaviour is tested through the browser; because shared accounts make parallelism impossible; because page objects grew into a second application; because a tag means three things. These are architecture decisions, and they are cheap to make on day one and expensive to change at test five hundred.

## When NOT to Use

- the shape is settled and the need is to write it down for new readers: use `documenting-test-suites`
- the need is to move an existing Cypress or Selenium suite: use `migrating-tests-to-playwright`, which calls this skill for its target-shape phase
- the need is CI layout (triggers, shards, caching): use `automating-ci-test-pipelines`; this skill defines the tags and projects it selects on

## Operating Principles

- **Test each behaviour at the lowest layer that can prove it.** Business rules in unit tests, contracts and permissions in API tests, rendering and widget behaviour in component tests, journeys across pages in E2E. The E2E layer is thin and covers what only it can see.
- **Decide deliberately, record briefly.** Each significant choice gets a decision record with the alternatives and the condition that would reverse it.
- **Isolation is an architectural property.** Whether tests can run in parallel is decided by the data and auth strategy, not by individual test authors.
- **One way to do each thing.** One place for setup with teardown (fixtures), one pattern for UI interaction, one tag meaning per tag. Two ways is a convention nobody follows.
- **Shape follows the team.** A suite owned by three QA engineers and a suite every developer writes into need different levels of abstraction. Name the owners first.
- **Start small and promote.** Inline first, extract to a helper when repeated, to a page object or fixture when the promotion rule says so. Abstraction ahead of need is the most common design debt in test suites.

## Workflow

### Phase 0: Gather the context

Collect before deciding anything:

- the application's architecture: frontend framework, backend services, what the team owns versus consumes
- existing tests at each layer, their runners, counts, and runtime
- environments: local, ephemeral per PR, shared staging, production-like; who controls their data
- who writes and who maintains tests: developers, QA engineers, both
- the immediate trigger: new suite, migration, a suite that has become slow or inconsistent

If the team cannot say who owns the suite, that is the first decision to record.

### Phase 1: Place behaviour on layers

For the main features, decide which layer proves which behaviour. `./resources/layer-placement.md` has the decision matrix and the signals that a test is on the wrong layer.

Output a short table: feature area, behaviours, layer per behaviour. Flag existing E2E tests that belong lower (validation messages, permission matrices, calculation edge cases) as candidates to push down.

Do not prescribe a ratio. A pyramid, a trophy, or a diamond describes an outcome; the per-behaviour placement is the decision.

### Phase 2: Choose the reuse patterns

Decide what goes into fixtures, page objects, helpers, and whether a screenplay-style layer is justified. `./resources/reuse-patterns.md` has the selection rules and examples. The defaults for a Playwright/TypeScript suite:

- **fixtures** (`test.extend`) for anything with a lifecycle: auth state, API clients, created test data, page objects that need setup
- **page objects** only for pages or components with many interactions reused across several files; they expose intent-level methods and locators, and assertions stay in tests unless an assertion is itself a reusable check
- **helpers** for stateless utilities: data builders, formatters
- **screenplay** only when many actors, roles, and interfaces (UI, API, email) share tasks, and the team will maintain the extra layer

Record what each layer may and may not contain. "Page objects never call `expect`" or "page objects may expose `expectLoaded()`": either is fine; leaving it open is not.

### Phase 3: Decide test data and auth

The decisions that determine whether the suite can run in parallel:

- **data creation**: each test creates what it needs through the API or a seeding fixture, and tears it down; shared reference data is read-only
- **uniqueness**: generated values include something unique per test; per-worker resources keyed by worker and shard
- **auth**: log in once per role through a setup project, save `storageState` to a gitignored `.auth/` folder, and reuse it; one project or fixture per role; per-worker accounts when tests mutate account state
- **mocking boundary**: your own backend stays real in E2E; third parties are stubbed (`mocking-network-and-time`)
- **sensitive data**: synthetic by default (`handling-sensitive-test-data`)

`designing-test-data` designs the values themselves; this phase decides the mechanism.

### Phase 4: Lay out folders, config, and environments

`./resources/structure-config-and-tags.md` has layouts for a single app and a monorepo, a config skeleton, and environment handling. The decisions:

- where each layer's tests live, and the naming convention (`*.spec.ts`, `*.setup.ts`, `*.test.ts`)
- where fixtures, page objects, helpers, and test data builders live
- projects: browsers and devices, setup projects, role projects, and which run where
- environments: `baseURL` and credentials from environment variables, one config with per-environment values, no hosts hard-coded in tests
- timeouts, retries, trace, and reporter defaults (CI-specific values are covered in `automating-ci-test-pipelines`)

### Phase 5: Define tags and ownership

- a small tag taxonomy with one meaning per tag: run selection (`@smoke`, `@slow`), state (`@quarantine`), and optionally area; no tags that duplicate folders
- an owner per folder or area, expressed where tools can read it (a CODEOWNERS file, or an annotation), so failures route to someone
- the tag glossary itself is written with `documenting-test-suites`

### Phase 6: Record the decisions

Write one decision record per significant choice using the template in `documenting-test-suites` (`test-adr-template.md`). `./resources/architecture-decision-checklist.md` lists the decisions that are usually worth a record and the questions each must answer. At minimum: layer placement policy, reuse pattern, data and auth strategy, environment strategy.

### Phase 7: Prove the shape with a thin slice

Before the design is declared done, implement one real journey end to end in the proposed structure: a setup project, one fixture, one page object if the rules call for one, one API-seeded test, tags, and the CI command. Run it with several workers and `--repeat-each=3`. Problems found here are cheap; the same problems found after two hundred tests are a migration.

## Common Failure Modes

- every behaviour tested through the browser because that is where the test framework is
- a base page class with forty methods that every page object inherits
- page objects that make assertions, wait with sleeps, and hold test data
- one shared admin account used by every test, so workers are pinned to 1
- `globalSetup` that logs in by UI and writes one `storageState` for all roles
- tags that overlap folders, so `@checkout` and `tests/checkout/` disagree
- environment URLs hard-coded in `page.goto`
- an architecture document with no decision records, so every choice is re-argued
- designing the abstraction layer before any test has been written in it

## Resource Map

- `./resources/layer-placement.md` - which layer proves which behaviour, signals of a misplaced test, and the push-down checklist
- `./resources/reuse-patterns.md` - fixtures, page objects, helpers, and screenplay: selection rules, boundaries, and examples
- `./resources/structure-config-and-tags.md` - folder layouts, config skeleton with setup and role projects, environment handling, tag taxonomy, ownership
- `./resources/architecture-decision-checklist.md` - the decisions worth recording and the questions each record must answer

## Related Skills

- `documenting-test-suites` - the decision record template, README, and tag glossary for the shape decided here
- `migrating-tests-to-playwright` - uses this skill to fix the target shape before translating
- `automating-ci-test-pipelines` - runs the layers, tags, and projects defined here on the right triggers
- `designing-test-data` - the values and boundary cases inside the data strategy
- `mocking-network-and-time` - the mocking boundary per layer
- `writing-unit-tests` - the standard for the unit layer
- `testing-api-contracts` - the contract layer between services
- `stabilizing-flaky-tests` - when flakiness traces back to a design decision such as shared accounts
- `handling-sensitive-test-data` - when the data strategy touches personal or production data

## Definition of Done

This skill is complete when:

- owners of the suite are named
- the main feature areas have a layer per behaviour, and misplaced existing tests are listed as push-down candidates
- the reuse patterns are chosen, with written rules for what each may contain
- the data and auth strategy supports parallel runs: per-test or per-worker data, `storageState` per role in a gitignored folder
- the folder layout, project list, and environment handling are written down, with no hard-coded hosts
- the tag taxonomy has one meaning per tag and an owner per area
- each significant decision has a record with alternatives and a revisit condition
- one real journey runs in the proposed structure with several workers and repeated runs
