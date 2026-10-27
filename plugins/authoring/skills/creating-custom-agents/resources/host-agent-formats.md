# Custom agents per host

Read this when an agent goes into a user's own project. For this collection, write `src/agents/<name>.md` in the source format from the repository's `CONTRIBUTING.md`; the build produces all three files below from it.

The same agent in each format: a read-only reviewer that may search and read but not edit or run commands.

## This collection (source)

```markdown
---
name: scenario-risk-reviewer
title: Scenario Risk Reviewer
description: Reviews feature specs and draft test plans for missing edge cases and risky assumptions before implementation. Use when a plan looks complete but has not been challenged. For writing the plan itself, use test-planner.
capabilities: [read, search]
---

<body: scope, workflow, rules, stop conditions, output contract>
```

`capabilities` is host-neutral; `scripts/lib/hosts.js` translates it. Allowed keys: `name`, `title`, `description`, `capabilities`, `mcp`. No `model`.

## GitHub Copilot: `.github/agents/<name>.agent.md`

```markdown
---
name: 'Scenario Risk Reviewer'
description: 'Reviews feature specs and draft test plans for missing edge cases and risky assumptions before implementation.'
tools: ['read', 'search']
---

<body>
```

| Key | Notes |
| --- | --- |
| `description` | Required. |
| `name` | Display name; defaults to the file name. |
| `tools` | Aliases: `read`, `search`, `edit`, `execute`, `web`, `agent`, `todo`, or `<mcp-server>/*`. Omitted means all tools. |
| `model` | Optional. GitHub's guidance recommends it; leave it out of files meant to outlive a model release. |
| `target` | `vscode` or `github-copilot`; omitted means both. |
| `user-invocable` | `false` hides the agent from the picker but keeps it available as a subagent. |
| `disable-model-invocation` | `true` stops other agents from invoking it while keeping it in the picker. |
| `handoffs` | VS Code only: buttons that move to another agent with a pre-filled `prompt`; keep `send: false` unless auto-submit is safe. |
| `mcp-servers`, `metadata` | Organization/enterprise agents and GitHub.com only. |

Organization- or enterprise-level agents live in an `agents/` folder instead of `.github/agents/`. An orchestrator that starts subagents needs `agent` in its tools, and its tool list caps what the subagents can use.

## Claude Code: `.claude/agents/<name>.md`

```markdown
---
name: scenario-risk-reviewer
description: Reviews feature specs and draft test plans for missing edge cases and risky assumptions before implementation. Use when a plan looks complete but has not been challenged.
tools: Read, Grep, Glob
---

<body>
```

- `tools` is a comma-separated list of Claude Code tool names (`Read`, `Grep`, `Glob`, `Edit`, `Write`, `Bash`, `WebFetch`, `WebSearch`, `Agent`, MCP tools as `mcp__<server>__*`). This collection also grants `Skill` so agents can use skills by name.
- Other frontmatter Claude Code reads includes `disallowedTools`, `skills`, `mcpServers`, `permissionMode`, `model`, `hooks`. Agents shipped inside a plugin ignore `hooks`, `mcpServers` and `permissionMode`.
- The main agent delegates by matching the request to `description`.
- A subagent cannot start another subagent. Anything that needs several agents must be coordinated from the main conversation (see `creating-orchestration-packs`).
- In a plugin, agent files go in `agents/`. Claude Code scans that folder recursively, so keep other hosts' agent files outside it.

## OpenAI Codex: `.codex/agents/<name>.toml`

```toml
name = "scenario_risk_reviewer"
description = "Reviews feature specs and draft test plans for missing edge cases and risky assumptions before implementation."
developer_instructions = '''
<body>

Do not create, modify or delete files. Report what should change instead.
'''

[features]
shell_tool = false
```

- Required fields: `name`, `description`, `developer_instructions`. Optional ones include `model`, `model_reasoning_effort`, `sandbox_mode` and agent-local `mcp_servers`.
- There is no per-agent tool allowlist. Restrict with `sandbox_mode`, turn the shell off with `[features] shell_tool = false`, and state edit limits in `developer_instructions`. The agent inherits the parent session's sandbox; the file sets defaults, not hard isolation.
- Personal agents go in `~/.codex/agents/`. Codex does not load agents from plugins, so a plugin can only ship the TOML files for the user to copy.
- This collection writes Codex names with underscores (`scenario_risk_reviewer`).
- A subagent cannot start another subagent.

## Porting checklist

- [ ] The body names capabilities, not one host's tool names, so it reads correctly in every wrapper.
- [ ] The tool list in each wrapper matches the same capabilities.
- [ ] Edit and shell restrictions for Codex are stated in `developer_instructions` and `[features]`.
- [ ] No body instruction asks the agent to start another agent, unless the target is Copilot only.
