# Beyond Codegen 2.0

A guide to two-stage AI test generation: the model first designs risk-based test scenarios, a human reviews them, and only the approved scenarios are turned into test code.

It exists because one-shot generation ("write Playwright tests for the checkout page") tests what the model can see, not what the feature promises. The output compiles, runs green, and covers the happy path plus whatever the DOM happened to show. The scenarios nobody asked for are the ones that would have found the bug: paying for a cancelled order, a double submit, the 256-character name. Once the code exists, reviewing coverage means reading test code, and nobody does that line by line. Splitting design from code moves the review to the cheapest point, a list of Given/When/Then statements a product owner can read in five minutes.

## What you use

The design stage ships in the `qa-core` plugin; the code stage uses the `test-automation` plugin.

| Resource | Type | Purpose |
| --- | --- | --- |
| [`/edge-case-scenario-generator`](../skills/edge-case-scenario-generator/SKILL.md) | Command | Stage 1: turns a user story and its application states into BDD scenarios (happy path, negative, boundary, concurrency, invalid state transitions), saved to `spec/edge-cases.md` |
| [`ai-architect`](../agents/ai-architect.md) | Agent | Runs the command's work and keeps the two stages apart: design first, code only from approved scenarios |
| [`/generate-gherkin-scenarios`](../skills/generate-gherkin-scenarios/SKILL.md) | Command | Alternative stage 1 when you need formal Gherkin with scenario outlines for a BDD framework |
| [`/test-generator`](../../test-automation/skills/test-generator/SKILL.md) | Command | Stage 2: generates tests from a written plan file, such as the approved `spec/edge-cases.md` (in `test-automation`) |
| [`/playwright-generate-test`](../../test-automation/skills/playwright-generate-test/SKILL.md) | Command | Stage 2 for one scenario at a time: runs it live in the browser first, then writes the test (in `test-automation`) |

## When to use it

Use the two stages when the feature has **state** (orders, subscriptions, approvals, anything with a lifecycle), **rules** (limits, permissions, validation), or **money and data** at stake. These are the features where missing scenarios cost the most and where a model guessing from the UI misses them.

Skip it for a static page, a one-field form, or a quick smoke test. There, the scenario list is obvious and the review costs more than it saves; generate the test directly with `/playwright-generate-test`.

## How to use

1. Install the `qa-core` and `test-automation` plugins (see the quick start in the main README). In Codex, also copy `qa-core`'s `codex/agents/ai-architect.toml` into `.codex/agents/`.
2. Run `/edge-case-scenario-generator` (`$edge-case-scenario-generator` in Codex). Give it the user story and, separately, the states the main entity can be in (`Pending Payment`, `Paid`, `Cancelled`, …). Without the states it cannot produce invalid-transition scenarios, and those are the ones one-shot generation never finds.
3. Review `spec/edge-cases.md` before any code is written (see below). Edit the file directly; it is the contract for stage 2.
4. Run `/test-generator` with `spec/edge-cases.md` as the plan, or `/playwright-generate-test` with a single scenario when you want it verified in the live app first.
5. Check the generated tests against the scenarios: one test (or one `test.step` group) per approved scenario, each `Then` backed by an assertion. A scenario with no matching assertion was dropped on the way, so put it back.

## What a good scenario review looks like

Read the list with someone who knows the feature: a product owner, a developer, or the tester who explored it. For each scenario, ask:

- **Is the `Then` observable?** "Then the payment is rejected" needs to say how: an error message, a status, an unchanged balance. If you cannot write the assertion, the scenario is not ready.
- **Is it true?** The model invents plausible rules ("passwords must contain a symbol"). Strike any expected behaviour nobody can point to in the requirements, or turn it into a question for the product owner.
- **Is it a duplicate?** Five invalid-email variants test the same rule. Keep one, plus the boundary cases.
- **What is missing?** Check the categories the generator covers (happy path, validation, boundaries, concurrency, invalid state transitions) against the states you listed. Every terminal state should have at least one "action on a finished object" scenario.
- **What level does it belong to?** A pure validation rule is cheaper as a unit or API test. Mark those so stage 2 does not turn every scenario into a browser test.

The review is done when every remaining scenario has an observable outcome, traces to a requirement or a confirmed decision, and has a test level.

## What goes wrong without it

- **Happy-path suites.** The model writes the flow it can see. Invalid state transitions and concurrency need knowledge of the domain, and they never appear.
- **Invented behaviour frozen into assertions.** A guessed rule becomes a passing test, and the test now defends the guess.
- **Coverage you cannot discuss.** Product owners do not read `.spec.ts` files, so nobody outside the test code can say what is missing.
- **Review fatigue.** Reviewing 400 lines of generated code for coverage is slow and gets skipped; reviewing 12 scenarios is not.
