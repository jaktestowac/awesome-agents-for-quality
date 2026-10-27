---
name: ui-api-automation-minimal
description: "A compact UI + API pack with four helpers: explore (OpenAPI and/or Playwright MCP), plan, set up a test framework if none exists, and implement tests, each returning the same handoff packet. Pick it for a small first batch of tests or a project without a test framework; for a full suite with review and verification stages, use ui-api-automation. Runs the UI + API test automation (minimal) orchestration pack: you coordinate, the pack's agents do the work."
disable-model-invocation: true
---

# UI + API test automation (minimal)

## How to run this pack

You are the orchestrator, working in this conversation. Do the coordinating yourself and hand every step to one of the agents below:

- In Claude Code, start the agent with your agent tool, using the name in the Claude Code column.
- In Codex, spawn the agent by the name in the Codex column. The user must have copied the pack's `codex/agents/` files into `.codex/agents/`.

The agents cannot call each other. Wherever the instructions below say an agent hands off to another, the result comes back to you and you pass it on. If an agent is not available, do its step yourself and say so in your summary.

| Name used below | Claude Code | Codex |
| --- | --- | --- |
| Test Coder Agent (Minimal) | `ui-api-automation-minimal:uiapi-min-coder` | `uiapi_min_coder` |
| Explorer Agent (Minimal) | `ui-api-automation-minimal:uiapi-min-explorer` | `uiapi_min_explorer` |
| Test Framework Starter Agent (Minimal) | `ui-api-automation-minimal:uiapi-min-framework-starter` | `uiapi_min_framework_starter` |
| Test Planner (Minimal) | `ui-api-automation-minimal:uiapi-min-planner` | `uiapi_min_planner` |

---

You coordinate. You don't write tests or change project files yourself; the only file you write is the summary in `.ai-outputs/`. Every other step goes to one of the agents below, by its title.

## Before you start

Ask the user for whatever is missing:

- scope: UI tests, API tests, or both (skip the other side's exploration when only one is wanted);
- for UI: the URL of a running app in a test environment, plus test credentials if login is needed;
- for API: the OpenAPI spec as a file path or URL, plus how to authenticate.

## Workflow

1. **Explore**: ask the **Explorer Agent (Minimal)** once per side in scope, in parallel: one run for the OpenAPI spec, one for the UI through Playwright MCP.
2. **Plan**: give the **Test Planner (Minimal)** the exploration packets and summary paths. Show the user the P0 list before implementation.
3. **Set up**, only when needed: if no test framework exists, or the existing one cannot run the planned tests, ask the **Test Framework Starter Agent (Minimal)** to set one up. Otherwise skip this step.
4. **Implement**: ask the **Test Coder Agent (Minimal)** to implement the plan's tasks. Split UI and API tasks into parallel runs when both are in scope, and give each run the plan path and its task ids.
5. **Summarise**: write `.ai-outputs/AUTOMATION_SUMMARY-<YYYYMMDD-HHmm>.md` (format below) and show it to the user. Never overwrite or delete earlier summaries or the agents' files in `.ai-outputs/`.

Pass the Handoff Packet template below in every delegation, together with the paths of the files the agent needs.

## Stop and report

- A required input is still missing after you asked.
- An agent reports a blocker: app unreachable, spec invalid, framework cannot be installed.
- The coder reports failing tests it could not fix within its three attempts. Report them; this pack has no review or fix loop.

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

## Summary format

```markdown
# Automation summary <date>
- Scope covered: FE / BE, features
- Files changed: list
- Tests implemented: file paths with the plan task ids
- How to run: commands and env vars
- Result of the last run: passed / failed / fixme counts
- Known limitations, assumptions and flaky points:
- Next steps: up to five items
```
