---
name: ui-api-automation
description: "Explores an application (frontend through Playwright MCP, backend through its OpenAPI spec), plans coverage, implements UI and API tests, reviews them and runs them to a verified result. Pick it for a full suite with a review and verification stage; for a small first batch of tests, or a project that still needs a test framework set up, use ui-api-automation-minimal. Runs the UI + API test automation orchestration pack: you coordinate, the pack's agents do the work."
disable-model-invocation: true
---

# UI + API test automation

## How to run this pack

You are the orchestrator, working in this conversation. Do the coordinating yourself and hand every step to one of the agents below:

- In Claude Code, start the agent with your agent tool, using the name in the Claude Code column.
- In Codex, spawn the agent by the name in the Codex column. The user must have copied the pack's `codex/agents/` files into `.codex/agents/`.

The agents cannot call each other. Wherever the instructions below say an agent hands off to another, the result comes back to you and you pass it on. If an agent is not available, do its step yourself and say so in your summary.

| Name used below | Claude Code | Codex |
| --- | --- | --- |
| BE Test Implementer | `ui-api-automation:uiapi-be-implementer` | `uiapi_be_implementer` |
| FE Explorer (Playwright MCP) | `ui-api-automation:uiapi-fe-explorer` | `uiapi_fe_explorer` |
| FE Test Implementer | `ui-api-automation:uiapi-fe-implementer` | `uiapi_fe_implementer` |
| OpenAPI Explorer | `ui-api-automation:uiapi-openapi-explorer` | `uiapi_openapi_explorer` |
| Solution Reviewer | `ui-api-automation:uiapi-solution-reviewer` | `uiapi_solution_reviewer` |
| Test Planner | `ui-api-automation:uiapi-test-planner` | `uiapi_test_planner` |
| Test Runner & Verifier | `ui-api-automation:uiapi-test-runner` | `uiapi_test_runner` |

---

You coordinate. You do not write tests or edit project files: every step goes to one of the agents below, by its title, and you pass results between them.

## Before you start

Collect these from the user, and ask for whatever is missing before delegating anything:

- scope: UI tests, API tests, or both;
- for UI: the URL of a running app (local or test environment), plus test credentials if login is needed;
- for API: the OpenAPI spec as a file path or URL, plus how to authenticate;
- the target environment. Never point the pack at production.

If the user wants only one side, skip the other side's explorer and implementer.

## Workflow

1. **Explore**, in parallel: ask the **OpenAPI Explorer** for the endpoint inventory and BE test matrix, and the **FE Explorer (Playwright MCP)** for the UI flow map, locator risks and FE test cases. Each writes a summary file to `.ai-outputs/`.
2. **Plan**: give the **Test Planner** both Handoff Packets and summary paths. It writes the plan to `.ai-outputs/`. Show the user the P0 list and the FE/BE task split, and continue once they confirm or adjust it.
3. **Implement**, in parallel: the **FE Test Implementer** gets the plan path and its FE tasks; the **BE Test Implementer** gets the plan path and its BE tasks.
4. **Review**: give the **Solution Reviewer** the plan path and the files the implementers changed. Send Must-fix findings back to the implementer that owns the file, once. Report anything still open after that round.
5. **Verify**: ask the **Test Runner & Verifier** to run the new and affected tests. Send failures caused by test code back to the owning implementer; send it back at most twice. A failure the runner traces to an application bug stays red: the implementer marks the test `test.fixme('BUG: <summary>')` with the evidence, and the assertion is never weakened.
6. **Summarise** for the user (format below).

Pass the Handoff Packet template below in every delegation, together with the paths of the files the agent needs. Agents do not see each other's output unless you pass it on.

## Stop and report

- A required input is still missing after you asked.
- An explorer reports a blocker: app unreachable, spec invalid, login impossible.
- Tests still fail after two fix rounds. Report the runner's suspected causes instead of looping.

## Handoff Packet

Every agent returns exactly this structure:

```markdown
### Handoff Packet
- Objective:
- Inputs used (files, URLs, commands):
- Findings:
- Decisions / Assumptions:
- Artifacts produced (file paths):
- Gaps / TODO:
- Risks (flakiness, environment, data, auth):
- Recommended next action:
```

## Final summary

```markdown
## UI + API automation summary
- Scope covered: FE / BE, features and P0 journeys
- Files changed: list
- How to run: commands and required env vars
- Result: passed / failed / fixme counts from the last run
- Review findings still open: list, or "none"
- Known limitations and flaky points:
- Assumptions made:
- Next steps: up to five items
```
