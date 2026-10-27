---
name: creating-hooks
description: "Creates lifecycle hooks: small scripts the host runs at session start, before or after a tool call, on prompt submit or at stop, to log, add context, warn or block deterministically. Covers GitHub Copilot `hooks.json`, Claude Code hooks in settings or a plugin, OpenAI Codex `.codex/hooks.json`, and this collection's per-host hook source. Use when a guardrail must hold regardless of what the model decides (block a dangerous command such as git push or rm -rf, check a file after every edit, inject context at start), when porting a hook between tools, or when a hook is slow, noisy or blocks the wrong things. For guidance the agent may weigh, use `creating-instructions`."
argument-hint: "What the hook must enforce or record, the lifecycle event, allow/warn/deny behaviour, target tools and operating systems"
user-invocable: true
---

# Creating Hooks

A hook is code the host runs at a lifecycle point, outside the model's control. That is its value and its risk: it holds even when the model would not comply, and a buggy hook blocks everyone. All three hosts have hooks, but the event names, payloads, output channels and install locations differ, so a hook has **one implementation per host**, sharing only its policy.

## Where you are writing

| Writing for | Source | Check |
| --- | --- | --- |
| **This collection** | `src/hooks/<name>/` with `hook.yaml` (`name`, `title`, `description`, `hosts: [copilot, claude]`), a `copilot/` and a `claude/` implementation, and optional shared config (see the repository's `CONTRIBUTING.md`, "Hooks") | `npm run validate`; pipe a sample event into the Claude Code script; run the Copilot script with a sample payload |
| **A user's project** | The host's hook location, see [Per-host summary](#per-host-summary) | Trigger the event once with an allowed and once with a denied input |

This collection publishes each Claude Code hook as its own opt-in plugin (scripts run with `node` and `${CLAUDE_PLUGIN_ROOT}`, so no shell or `jq` is needed) and each Copilot hook as a folder to copy into `.github/hooks/<name>/`. It ships no Codex hooks.

## Decide that a hook is right

Use a hook when behaviour must be deterministic at a lifecycle point. Otherwise: guidance the agent may weigh → `creating-instructions`; a reusable workflow → `creating-skills`; a task the user starts → `creating-prompts`. Prefer a lint rule, schema or CI check when the check belongs to the codebase rather than to the agent session.

## Design rules

- **Fail open.** Exit 0 and allow when input is missing, malformed or unexpected. A hook that crashes must not block work. This collection requires it.
- **Observe, then warn, then block.** Start by logging; block only when the policy is stable and the message is clear.
- **Fast.** Hooks on tool events run on every call. Keep them well under the timeout; filter by tool name as early as possible (a host matcher where supported, else the first lines of the script).
- **Say why and what instead.** A denial names the rule and the safe alternative, in plain words. The agent reads it and adjusts.
- **Deterministic.** Pattern checks, file checks, exit codes. No fuzzy judgment.
- **Small blast radius.** Block the narrow, high-confidence case (`rm -rf /`), not a whole class of commands.
- **Policy separate from mechanism.** Keep patterns and modes in a config file or environment variable so one script can log in one repo and block in another.

## Workflow

### 1. Choose the event and the mode

Settle: the event (session start, before tool, after tool, prompt submit, stop), the tools it applies to, and the mode (observe, add context, warn, deny). Check the event exists in each target host; it may not (see the table). Done when each target host has a named event, or is ruled out.

### 2. Define the contract

Write down: the exact condition, the output for allow, warn and deny, the message text, the timeout, and the fail-open behaviour. Done when someone else could write the test cases from it.

### 3. Implement per host

Start from [`resources/hook-template-pack.md`](resources/hook-template-pack.md) and see [`resources/hook-example-pack.md`](resources/hook-example-pack.md). Event names, payload fields and output channels per host are in [`resources/host-hook-formats.md`](resources/host-hook-formats.md); read it before writing any script.

### 4. Test

- Pipe a sample payload for the allowed case and the denied case into each script; check exit code and stdout.
- Pipe malformed JSON; the script must exit 0 and allow.
- Time it: well under the configured timeout.
- Then trigger the real event once in the host.

### 5. Validate

Run [`resources/hook-quality-checklist.md`](resources/hook-quality-checklist.md). In this collection, `npm run validate` passes.

## Per-host summary

| | GitHub Copilot | Claude Code | OpenAI Codex |
| --- | --- | --- | --- |
| Config | `.github/hooks/*.json` (`"version": 1`) | `hooks` in `.claude/settings.json` or `~/.claude/settings.json`; `hooks/hooks.json` in a plugin | `.codex/hooks.json`, with `[features] codex_hooks = true` in `config.toml` |
| Event names | camelCase: `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `errorOccurred`, `agentStop` | PascalCase: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `Notification`, `PreCompact`, `SessionEnd`, and more | `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop` |
| Tool payload | `toolName`, `toolArgs` (a JSON **string**, parse it again) | `tool_name`, `tool_input` (an object) | Tool events currently fire for shell commands only; check the field names in the Codex docs |
| Block a tool call | stdout `{"permissionDecision":"deny","permissionDecisionReason":"…"}`, exit 0 | exit 2 with the reason on stderr | stdout `permissionDecision: "deny"`, legacy `decision: "block"`, or exit 2 |
| Add context for the agent | — | `SessionStart` stdout; `hookSpecificOutput.additionalContext` after a tool call | `UserPromptSubmit` can inject context |
| Script entry | `bash` and/or `powershell` command lines, `cwd`, `timeoutSec`, `env` | `command` (+ `args`), `timeout`, `matcher` regex on tool names | `type: "command"`, `command`, `timeout`/`timeoutSec`; regex `matcher` on tool events and `SessionStart` |

The Codex column comes from OpenAI's Claude-to-Codex migration reference (checked 2026-04-20); it notes the runtimes are not 1:1 and that Codex does not discover hooks from skills, agents or plugins. Re-check before relying on it.

## Common failure modes

- a hook where an instruction would do
- broad deny patterns with a vague message
- slow scripts on per-tool-call events
- a hook that blocks when its own input is malformed
- parsing Copilot's `toolArgs` as an object (it is a string)
- one script assumed to work in every host; payloads and outputs differ
- Bash-only scripts for a team on Windows, with no `powershell` entry or cross-platform runtime
- configuration and scripts that disagree with the README

## Resource map

- [`resources/host-hook-formats.md`](resources/host-hook-formats.md): config shape, events, payload and output per host, with sources. Read before writing a script.
- [`resources/hook-template-pack.md`](resources/hook-template-pack.md): README, config and script scaffolds for Copilot and Claude Code. Read when starting.
- [`resources/hook-example-pack.md`](resources/hook-example-pack.md): a destructive-command blocker in both hosts. Read for a worked deny hook.
- [`resources/hook-quality-checklist.md`](resources/hook-quality-checklist.md): final review. Read before handing off.

## Related Skills

- `creating-instructions`: when guidance is enough and enforcement is not needed
- `creating-plugins`: to ship a Claude Code hook as an installable plugin
- `creating-skills`: for workflows a hook should not try to run
- `generating-quality-gate-workflows`: when the check belongs in CI rather than in the agent session

## Definition of Done

- The event exists in every target host, or the README says which host is not covered and why.
- Allow, warn and deny outputs and messages are defined and tested with sample payloads.
- Malformed input exits 0 and allows; the script finishes well under its timeout.
- Configuration, scripts and README agree on event, mode, timeout and prerequisites.
- This collection: `src/hooks/<name>/` has `hook.yaml` and one folder per host listed in `hosts`, and `npm run validate` passes. A user's project: the hook fired once in the real host with the expected result.
