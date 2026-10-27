---
name: creating-custom-agents
description: "Creates custom agents (subagents): a focused role with its own instructions, the fewest tools the job needs, explicit boundaries, stop conditions and an output contract, written as a Copilot `.agent.md`, a Claude Code agent file, a Codex agent TOML, or this collection's single-source agent format. Use when a recurring job needs its own role or tool limits, when an existing agent has grown too broad or has too many tools, or when a review step should run separately from the work it reviews. For several cooperating agents with an orchestrator, use `creating-orchestration-packs`; for reusable procedure without a role, use `creating-skills`."
argument-hint: "Agent purpose, who invokes it, the tools it needs, and nearby agents or skills"
user-invocable: true
---

# Creating Custom Agents

A custom agent is a named role the main agent (or the user) hands work to. It runs with its own instructions and, where the host allows, its own tool limits, and returns a result. Agents exist in all three hosts; the file format and tool vocabulary differ, the design does not.

## Where you are writing

| Writing for | Source | Tools are declared as | Check |
| --- | --- | --- | --- |
| **This collection** | `src/agents/<name>.md` with `name`, `title`, `description`, `capabilities`, `mcp` (see the repository's `CONTRIBUTING.md`, "Agent frontmatter") | Host-neutral `capabilities`; the build writes each host's file | Add it to one bundle in `bundles.yaml`; `npm run validate` |
| **A user's project** | The host's agent folder, see [Per-host summary](#per-host-summary) | That host's tool names | Run the agent on one real task |

In this collection, never pin a model and never name a host in the body; the build handles hosts.

## Decide whether an agent is the right asset

Choose an agent when the work needs at least one of: a separate context (so a long exploration does not fill the main conversation), tighter tool limits than the main agent, or an independent view (a reviewer that did not write the code). Otherwise:

- reusable procedure → a skill (`creating-skills`)
- a task the user starts on purpose → a command (`creating-prompts`)
- rules for certain files → instructions (`creating-instructions`)
- several roles in sequence → a pack (`creating-orchestration-packs`)

## What makes a good agent

- **One role, one output.** If the description needs "and also", it is two agents.
- **The description routes.** It is how the main agent decides to delegate: what the agent does, `Use when …`, and which neighbour to use instead.
- **Fewest tools.** A reviewer that never edits gets no edit tool. No tool list usually means *all* tools, which is rarely what you want.
- **Agent is WHO, skill is HOW.** Keep long procedures in a skill and tell the agent to use it by name; the agent file holds role, scope, rules and the output contract.
- **Stop conditions.** Cap retries, and say when to stop and report instead of improvising (blocked, out of scope, missing input).
- **An output contract.** The exact shape the agent returns, so the caller can act on it without re-reading the whole run.
- **No identity stub.** "You are an expert QA engineer" adds nothing on its own; a short role line is fine only when the scope, rules and output contract follow it.

## Workflow

### 1. Define the contract

From the request, or by asking one question at a time, settle:

- the job and the requests it should take, plus what it must hand off and to whom
- the tools it needs, and which powerful ones (edit, execute, web) it must not have
- what it returns, and where it writes files, if anywhere
- when it must stop and ask

Done when the role fits in two sentences and the tool list has a reason per entry.

### 2. Write the body

Start from [`resources/custom-agent.template.agent.md`](resources/custom-agent.template.agent.md). Sections, roughly: scope (owns / does not own, with hand-offs), workflow, rules with reasons, stop and ask conditions, output contract.

### 3. Write the host wrapper

The body is the same everywhere. Wrap it in the target's format: this collection's source frontmatter, or each host's native file from [`resources/host-agent-formats.md`](resources/host-agent-formats.md) (read it whenever the agent goes into a user's project).

### 4. Validate

- Run [`resources/custom-agent-quality-checklist.md`](resources/custom-agent-quality-checklist.md).
- This collection: `npm run validate` passes; the agent is in one bundle; any command that names it with `agent:` is in the same bundle.
- A user's project: invoke the agent on one real task and check that it stayed in scope, used only its tools and returned the contract.

## Per-host summary

| | GitHub Copilot | Claude Code | OpenAI Codex |
| --- | --- | --- | --- |
| File | `.github/agents/<name>.agent.md` | `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` (or `~/.codex/agents/`) |
| Format | Markdown + YAML frontmatter | Markdown + YAML frontmatter | TOML: `name`, `description`, `developer_instructions` |
| Tool limits | `tools:` list of aliases (`read`, `search`, `edit`, `execute`, `web`, `agent`, `todo`, `<server>/*`) | `tools:` comma-separated tool names (`Read, Grep, Glob`) | No per-agent tool list; `sandbox_mode`, a shell switch, and instructions |
| Can start other agents | Yes, with the `agent` tool | No: subagents cannot start subagents | No: subagents cannot start subagents |
| From a plugin | Loaded | Loaded | Not loaded; copy the TOML into `.codex/agents/` |

This collection's capability mapping (from `scripts/lib/hosts.js`):

| Capability | Copilot | Claude Code | Codex |
| --- | --- | --- | --- |
| `read` | `read` | `Read` | always on |
| `search` | `search` | `Grep`, `Glob` | always on |
| `edit` | `edit` | `Edit`, `Write` | told not to edit when absent |
| `execute` | `execute` | `Bash`, `PowerShell` | `[features] shell_tool = false` when absent |
| `web` | `web` | `WebFetch`, `WebSearch` | inherited |
| `agent` | `agent` | `Agent` | inherited |
| `todo` | `todo` | task tools | inherited |
| `ide` | `vscode` | none | none |

## Common failure modes

- a vague job ("help with testing") that overlaps every other agent
- every tool granted out of convenience, or no tool list at all
- a full workflow pasted into the agent instead of referencing a skill
- "iterate until it works" with no cap
- no output contract, so the caller cannot use the result without reading the whole run
- a model pinned in a file meant to outlive the model
- an agent that must call other agents, shipped to a host where subagents cannot

## Resource map

- [`resources/custom-agent.template.agent.md`](resources/custom-agent.template.agent.md): body scaffold. Read when starting an agent.
- [`resources/custom-agent.example.agent.md`](resources/custom-agent.example.agent.md): a finished read-only reviewer. Read when unsure about scope or output.
- [`resources/host-agent-formats.md`](resources/host-agent-formats.md): the same agent as a Copilot, Claude Code and Codex file, with frontmatter keys. Read when writing for a user's project.
- [`resources/custom-agent-quality-checklist.md`](resources/custom-agent-quality-checklist.md): final review. Read before handing off.

## Related Skills

- `creating-orchestration-packs`: when the job needs several agents and an orchestrator
- `creating-skills`: for the procedure the agent should follow
- `creating-prompts`: for a command that starts the agent with the right inputs
- `creating-plugins`: to ship the agent in an installable plugin
- `testing-agent-skills`: to test that the agent triggers and returns its contract

## Definition of Done

- The role, what it does not own, and who it hands off to fit in one short paragraph.
- Every granted tool or capability is used by the workflow; reviewers have no edit.
- The body has stop conditions with a cap and an exact output contract.
- No model is pinned in this collection's source; in a user's project, a model is set only when the user asked.
- This collection: the agent is in one bundle and `npm run validate` passes. A user's project: the file sits in the host's agent folder and handled one real task within scope.
