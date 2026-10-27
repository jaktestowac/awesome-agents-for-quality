---
name: creating-orchestration-packs
description: "Creates orchestration packs: an orchestrator plus a few narrow subagents (explore, plan, implement, review, verify) with minimal tools per role and one shared handoff-packet contract, built so they run in GitHub Copilot (orchestrator agent with handoffs) and in Claude Code and OpenAI Codex (orchestrator as a command in the main conversation, since subagents there cannot start subagents). Covers this collection's `src/packs/` format and hand-written packs in a user's project. Use when one agent's role has grown too broad, when phases need different tools or a fresh context, when review must be independent of implementation, or when a pack fails validation because a handoff target does not resolve. For a single agent, use `creating-custom-agents`."
argument-hint: "The workflow to orchestrate, the roles it needs, which steps can run in parallel, and where artifacts should be written"
user-invocable: true
---

# Creating Orchestration Packs

A pack splits one large job into roles: an orchestrator that delegates and synthesises, and subagents that each do one part and return a structured **handoff packet**. The value is the same as in a human team: a narrow scope with a clear output contract produces better work than one agent asked to do everything. The cost is coordination; a pack that costs more coordination than it saves is worse than one good agent.

## How the hosts run a pack

The hosts differ in one way that shapes every pack: **who may start a subagent.**

| | GitHub Copilot | Claude Code | OpenAI Codex |
| --- | --- | --- | --- |
| Orchestrator | A custom agent with the `agent` tool; the user picks it in the agent dropdown | A command (user-run skill) in the main conversation; subagents cannot start subagents | A command (`$name` skill) in the main conversation; subagents cannot start subagents |
| Subagents | `.github/agents/*.agent.md`, referenced by display name (`name`) | `.claude/agents/*.md` | `.codex/agents/*.toml`, copied in by the user |
| Wiring | `agents:` list and `handoffs:` buttons in frontmatter (VS Code) | The command names the agents to call | The command names the agents to spawn |
| Tool ceiling | The orchestrator's tool list caps what its subagents can use | Each agent's own `tools` | Each agent's sandbox settings, inherited from the session |
| Agent → agent hand-offs | Possible via `handoffs` | Results come back to the main conversation, which passes them on | Same as Claude Code |

So write orchestrator instructions that delegate **by role name** ("ask the Test Planner to…"), never by one host's tool name, and never let a subagent's instructions depend on calling another subagent.

## Where you are writing

**This collection** (see the repository's `CONTRIBUTING.md`, "Orchestration packs"):

```
src/packs/<pack>/
├── pack.yaml          name, title, description, orchestrator: <agent name>
├── GUIDE.md           optional: how the workflow runs, step by step
└── agents/<agent>.md  agent frontmatter + required `title` + optional `copilot:` block
```

- `title` is the agent's display name in Copilot and must be unique in the pack. `copilot.handoffs[].agent` and `copilot.agents` refer to titles and must resolve inside the pack (`npm run validate` fails otherwise; `agents: ["*"]` is allowed).
- `copilot:` may hold only `handoffs`, `agents`, `user-invocable`, `argument-hint`, `target`, `mcp-servers`.
- Agent names share one namespace with every other agent in the collection, because Codex keeps all agents in one folder. Prefix them with a short pack name (`uiapi-test-planner`).
- The build publishes one plugin per pack: Copilot gets every agent including the orchestrator; Claude Code and Codex get the helpers as agents and the orchestrator as a command named after the pack, with a table mapping each title to the agent name to call.

**A user's project:** write the files yourself per host, from [`resources/orchestration-pack.template.md`](resources/orchestration-pack.template.md). For Claude Code and Codex, the orchestrator is a user-run skill (`creating-prompts`), not an agent.

## Operating principles

- **A role earns its file.** Each agent has a scope no other agent has, or it is merged.
- **The orchestrator delegates and never implements.** Once it writes code, its context fills and the pack collapses into one agent with extra steps.
- **The reviewer did not write what it reviews.** Otherwise the review is a self-assessment.
- **Tools per role, minimal.** An explorer that cannot edit cannot damage anything.
- **One output contract for every subagent**, including a `Gaps` section. Mixed shapes make the synthesis guesswork.
- **Bounded.** Each delegation has a retry cap; the orchestrator stops and asks the user at decision points.

## Workflow

### 1. Check that a pack is justified

At least two should hold:

- the phases need different tools, and the union on one agent would be over-privileged
- a phase benefits from a fresh context
- two phases can run in parallel
- review is more useful from an agent that did not do the work
- the workflow is long enough that one agent loses the early instructions

If only one holds, write a single agent (`creating-custom-agents`).

### 2. Cut the roles

Split by what a role needs and produces, not by topic. A common cut, in this collection's capability terms:

| Role | Scope | Capabilities |
| --- | --- | --- |
| Orchestrator | Delegates, synthesises, asks the user at gates | `read`, `search`, `agent`, `todo` (+ `edit` if it writes the summary) |
| Explorer | Gathers facts, writes no product code | `read`, `search` (+ `edit` to save findings, `web` if it researches) |
| Planner | Turns findings into a prioritised plan | `read`, `search`, `edit` |
| Implementer | Writes and runs code within the plan | `read`, `search`, `edit`, `execute` |
| Reviewer | Judges the output, edits nothing | `read`, `search` |
| Runner | Runs tests, diagnoses, reports | `read`, `search`, `execute` |

An agent that saves its packet to a file needs `edit` even though it writes no product code. `agent` matters only for the Copilot orchestrator; in Claude Code and Codex the orchestrator is a command and helpers cannot delegate.

### 3. Fix the output contract

Every subagent returns the handoff packet: Objective, Inputs, Findings, Decisions, Artifacts, Gaps, Risks, Next action. Details and a worked example: [`resources/handoff-packet.md`](resources/handoff-packet.md). Agree one folder for artifacts (the packs here use `.ai-outputs/`), so nothing lands in the repository root.

### 4. Write the agents and the wiring

Start from [`resources/orchestration-pack.template.md`](resources/orchestration-pack.template.md). For Copilot wiring, list the subagents in the orchestrator's `agents` and add `handoffs` with an action label, a short prompt that references the finished work, and `send: false`. Hide subagents from the picker with `user-invocable: false`.

### 5. Validate

- This collection: `npm run validate` passes (titles, references, names unique across the collection). Add a `GUIDE.md` if the flow is not obvious.
- Run [`resources/orchestration-quality-checklist.md`](resources/orchestration-quality-checklist.md).
- Run the pack on one real task in each target host. Watch for an orchestrator that starts implementing, a subagent missing a tool that reports success anyway, vague handoff prompts, two agents doing the same work, and a `Gaps` section that is always empty.

## Common failure modes

- an orchestrator that implements when a subagent returns something incomplete
- a handoff or `agents` entry naming a title that does not exist in the pack
- agent names that collide with another pack or a standalone agent
- every agent granted every capability
- subagent instructions that call another subagent, which breaks in Claude Code and Codex
- subagents returning free-form prose in different shapes
- a reviewer that also implements
- five agents where two would do
- an MCP prerequisite (such as Playwright) nobody documented

## Resource map

- [`resources/orchestration-pack.template.md`](resources/orchestration-pack.template.md): a minimal pack (orchestrator + two subagents) in this collection's format, with notes for a hand-written Copilot, Claude Code or Codex version. Read when starting.
- [`resources/handoff-packet.md`](resources/handoff-packet.md): the output contract section by section, a worked example, and how it degrades. Read when writing subagent output rules.
- [`resources/orchestration-quality-checklist.md`](resources/orchestration-quality-checklist.md): pre-ship checks for naming, capabilities, wiring, contract and the live run. Read before handing off.

## Related Skills

- `creating-custom-agents`: when one agent is enough, and for writing each agent in the pack
- `creating-prompts`: for the orchestrator command in Claude Code and Codex, or an entry command
- `creating-skills`: for procedures the agents should share instead of repeating
- `creating-plugins`: for how packs are published as plugins
- `creating-instructions`: for conventions every agent should follow

## Definition of Done

- At least two of the step 1 conditions hold, and a single agent was considered.
- Every role has a scope no other role has; the reviewer does not implement.
- The orchestrator delegates only, by role name, and has stop-and-ask gates and retry caps.
- No subagent depends on calling another subagent.
- Capabilities are minimal per role; agents that run commands have `execute`, read-only roles have no `edit`.
- Every subagent returns the same packet shape, including `Gaps`; artifacts go to one agreed folder.
- This collection: `pack.yaml` names the orchestrator, every agent has a unique `title`, every Copilot reference resolves, agent names are prefixed and unique, and `npm run validate` passes.
- The pack ran on one real task in each target host.
