# UI + API Test Automation Orchestration Pack (Minimal)

A compact orchestration pack that explores an application (OpenAPI spec and/or the UI through Playwright MCP), plans a small set of tests, sets up a test framework if the project has none, and implements UI and API tests.

Pick this pack for a first batch of tests or a project without a test framework. It has no review or verification stage; for a full suite that is reviewed and run to a verified result, use [`ui-api-automation`](../ui-api-automation/).

## Agents and flow

| Agent                                    | Role                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `QA Orchestrator (Minimal)`              | Collects inputs, delegates every step, writes the summary            |
| `Explorer Agent (Minimal)`               | Explores the OpenAPI spec or the UI (Playwright MCP), one side a run |
| `Test Planner (Minimal)`                 | A short P0-first plan with task ids                                  |
| `Test Framework Starter Agent (Minimal)` | Sets up Playwright only when no usable framework exists              |
| `Test Coder Agent (Minimal)`             | Implements the assigned UI or API tasks and runs them                |

1. **Explore**: one explorer run per side in scope, in parallel. Summaries go to `.ai-outputs/`.
2. **Plan**: the plan goes to `.ai-outputs/`; the orchestrator shows you the P0 list before any code is written.
3. **Set up** (only if needed).
4. **Implement**: UI and API tasks in parallel runs. The coder makes at most three fix attempts per test and marks application bugs `test.fixme('BUG: …')` instead of weakening assertions.
5. **Summary**: a new `.ai-outputs/AUTOMATION_SUMMARY-<timestamp>.md` per run; earlier ones are kept.

The orchestrator stops and asks when the app URL, the spec, credentials or the scope are missing, and stops and reports when an agent hits a blocker.

## Starting the pack

See the plugin README: pick **QA Orchestrator (Minimal)** in Copilot's agent dropdown, run `/ui-api-automation-minimal` in Claude Code, or `$ui-api-automation-minimal` in Codex after copying the agents.

## Prerequisites

- For UI exploration, the **Playwright MCP server**. The plugin configures it in Claude Code and Codex; in Copilot, configure it in VS Code. See [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp).
- For API exploration, an OpenAPI spec (file or URL).

## Output contract

Every subagent returns the same **Handoff Packet**: objective, inputs used, findings, decisions/assumptions, artifacts produced, gaps/TODO, risks, recommended next action. The orchestrator passes the template in each delegation and merges the packets into the summary.
