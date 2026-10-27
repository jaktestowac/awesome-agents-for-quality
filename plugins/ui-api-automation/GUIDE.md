# UI + API Test Automation Orchestration Pack

An orchestration pack that explores an application (frontend through Playwright MCP, backend through its OpenAPI spec), plans test coverage, implements UI and API tests, reviews them and runs them to a verified result.

Pick this pack when you want the full loop with a review and a verification stage. For a small first batch of tests, or a project with no test framework yet, use the lighter [`ui-api-automation-minimal`](../ui-api-automation-minimal/) pack.

## Agents and flow

| Agent                          | Role                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `QA Orchestrator`              | Collects inputs, delegates every step, routes fixes back, writes the summary |
| `OpenAPI Explorer`             | Endpoint inventory and BE test matrix from the spec                          |
| `FE Explorer (Playwright MCP)` | UI flow map, locator and flakiness risks, FE test cases, from the live app   |
| `Test Planner`                 | One prioritized plan with an FE/BE task split                                |
| `FE Test Implementer`          | Playwright UI tests for the FE tasks; runs them before handing back          |
| `BE Test Implementer`          | API tests for the BE tasks; runs them before handing back                    |
| `Solution Reviewer`            | Read-only review with Must-fix / Should-fix / Consider findings              |
| `Test Runner & Verifier`       | Runs the suites and classifies each failure; never edits                     |

1. **Explore** (FE and BE in parallel). Each explorer writes a summary to `.ai-outputs/`.
2. **Plan.** The plan is written to `.ai-outputs/`, and the orchestrator shows you the P0 list and task split before any code is written.
3. **Implement** (FE and BE in parallel). Each implementer runs its own tests, with at most three fix attempts per test.
4. **Review.** Must-fix findings go back to the implementer once.
5. **Verify.** Test-code failures go back to the implementer, at most twice. Application bugs are marked `test.fixme('BUG: …')` with evidence, never hidden by a weaker assertion.
6. **Summary**: scope, changed files, how to run, results, open findings, next steps.

The orchestrator stops and asks when the app URL, the spec, credentials or the scope are missing, and stops and reports when an explorer hits a blocker or tests still fail after two fix rounds. Ask for UI only or API only and the other side is skipped.

## Starting the pack

See the plugin README: pick **QA Orchestrator** in Copilot's agent dropdown, run `/ui-api-automation` in Claude Code, or `$ui-api-automation` in Codex after copying the agents.

## Prerequisites

- The **Playwright MCP server** for UI exploration. The plugin configures it in Claude Code and Codex; in Copilot the FE Explorer declares it itself. See [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp).
- A running app in a test environment, and an OpenAPI spec (file or URL) for the backend.

## Output contract

Every subagent returns the same **Handoff Packet**: objective, inputs used, findings, decisions/assumptions, artifacts produced, gaps/TODO, risks, recommended next action. The orchestrator passes the template in each delegation and merges the packets into the final summary.
