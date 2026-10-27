# Orchestration Pack Template

A minimal pack: one orchestrator, two subagents. Copy, rename, and add a role only when it earns its file. Written in this collection's `src/packs/` format; the last section shows how to hand-write the same pack for each host in a user's project.

```
src/packs/coverage/
├── pack.yaml
├── GUIDE.md                      optional
└── agents/
    ├── cov-orchestrator.md
    ├── cov-analyst.md
    └── cov-implementer.md
```

Prefix agent names with a short pack name (`cov-`): agent names share one namespace across the whole collection.

---

## `pack.yaml`

```yaml
name: coverage
title: Coverage gaps
description: Finds coverage gaps in a test suite against its risk areas, then implements the highest-priority missing tests. Use when a suite needs gap analysis followed by implementation.
orchestrator: cov-orchestrator
```

---

## `agents/cov-orchestrator.md`

```markdown
---
name: cov-orchestrator
title: Coverage Orchestrator
description: Coordinates a coverage analyst and an implementer to find and close test gaps. Use when a suite needs gap analysis followed by implementation.
capabilities: [read, search, agent, todo]
copilot:
  agents:
    - Coverage Analyst
    - Coverage Implementer
  handoffs:
    - label: Analyze gaps
      agent: Coverage Analyst
      prompt: Analyze the suite against the risk areas and return a Handoff Packet with a prioritized gap list.
      send: false
    - label: Implement tests
      agent: Coverage Implementer
      prompt: Implement the approved gaps from the analyst's packet and return a Handoff Packet.
      send: false
---

You coordinate. You do not write or edit tests yourself.

## Workflow

1. Ask the Coverage Analyst for the prioritized gap list.
2. Read the packet. If `Gaps` names something that blocks implementation, ask the user or send the analyst back with a narrower question. Do not fill the gap yourself.
3. Show the user the top gaps and wait for approval of which to implement.
4. Ask the Coverage Implementer to implement the approved gaps.
5. If a packet comes back incomplete, send it back once with the missing item named. After two incomplete returns, stop and report.
6. Write the final summary.

## Out of scope

- Choosing the test strategy: the analyst offers options, the user decides.
- Production code changes, merges and pushes.

## Final summary

- Scope: what was analyzed and what was implemented
- Changes: files created or modified, with paths
- How to run: the exact command
- Limitations: the `Gaps` sections of all packets, combined
- Next steps: what remains
```

The orchestrator delegates **by title** ("ask the Coverage Analyst"). In Copilot that matches the agent's display name; in Claude Code and Codex the build adds a table mapping each title to the agent name to call.

---

## `agents/cov-analyst.md`

```markdown
---
name: cov-analyst
title: Coverage Analyst
description: Analyzes a test suite against its risk areas and returns a prioritized gap list. Writes findings only.
capabilities: [read, search, edit]
copilot:
  user-invocable: false
---

You analyze coverage. You write findings, never product code or tests.

## Extract

- The test inventory: what exists, at which level
- The risk areas, from the diff, the changelog or the user's statement
- For each risk area: covered, thin or missing
- Conventions the implementer must follow (locators, fixtures, data, naming), each with a file reference
- Ambiguities that would change the implementation, listed rather than assumed

## Deliverable

Write `.ai-outputs/coverage-gaps-<timestamp>.md` and return a Handoff Packet. The file holds a gap table (risk area, current coverage, verdict, priority), the conventions, and the ambiguities.
```

`edit` is granted only because the analyst saves its findings file; `execute` is absent because it runs nothing.

---

## `agents/cov-implementer.md`

```markdown
---
name: cov-implementer
title: Coverage Implementer
description: Implements the tests named in an approved gap list, following the suite's existing conventions.
capabilities: [read, search, edit, execute]
copilot:
  user-invocable: false
---

You implement tests from the approved gap list.

## Rules

- Follow the conventions the analyst recorded; do not invent new ones.
- Keep tests deterministic: isolated data, no fixed sleeps.
- Watch each new test fail against broken behaviour (or a temporarily inverted assertion) before reporting it done.
- Run the new tests. If one fails, fix and re-run at most three times; then stop and report it in `Gaps`.
- If a gap cannot be implemented, say so in `Gaps` instead of implementing something adjacent.

## Deliverable

A Handoff Packet with: files created or modified, the command to run the new tests, data setup and teardown, required environment variables, and which gaps remain.
```

---

## Hand-writing the same pack in a user's project

| Host | Orchestrator | Subagents | Notes |
| --- | --- | --- | --- |
| GitHub Copilot | `.github/agents/coverage-orchestrator.agent.md` with `name: 'Coverage Orchestrator'`, `tools: ['read', 'search', 'agent', 'todo']`, and the `agents` / `handoffs` keys from the `copilot:` block at top level | `.github/agents/coverage-analyst.agent.md` etc., `name` set to the title, `user-invocable: false` | The orchestrator's tools cap what its subagents can use: include `edit` and `execute` if subagents need them |
| Claude Code | `.claude/skills/coverage/SKILL.md` with `disable-model-invocation: true`; the body is the orchestrator's instructions plus a table: title → agent name | `.claude/agents/cov-analyst.md`, `cov-implementer.md` with `tools: Read, Grep, Glob, Edit` etc. | Runs in the main conversation; subagents return to it and cannot call each other |
| OpenAI Codex | `.agents/skills/coverage/SKILL.md` plus `agents/openai.yaml` with `policy.allow_implicit_invocation: false`; same title table | `.codex/agents/cov_analyst.toml` etc. (`name`, `description`, `developer_instructions`) | Users copy the TOML files in; add `[features] shell_tool = false` to roles without `execute` |

Agent file formats per host: `creating-custom-agents` (`resources/host-agent-formats.md`).

---

## Before shipping

- This collection: `npm run validate` (titles unique, every `copilot.agents` and `copilot.handoffs[].agent` resolves to a title in the pack, names unique across the collection).
- Then run the pack on a real task in each target host. Validation proves the wiring resolves; only a live run shows whether the roles were cut in the right places.
