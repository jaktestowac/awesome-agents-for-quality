# Hooks per host

Read this before writing a hook script. Hooks do not port by copying: event names, payload fields and the way a script blocks or adds context differ per host. Write the policy once, then one small implementation per host.

## GitHub Copilot

**Location.** `.github/hooks/`. Every `.json` file there is loaded. This collection publishes each hook as a folder to copy into `.github/hooks/<name>/`.

**Config.**

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "matcher": "bash",
        "bash": "./.github/hooks/<name>/check.sh",
        "powershell": "./.github/hooks/<name>/check.ps1",
        "cwd": ".",
        "timeoutSec": 5,
        "env": { "BLOCK_MODE": "deny" }
      }
    ]
  }
}
```

| Field | Notes |
| --- | --- |
| `type` | `"command"` |
| `bash`, `powershell` | One or both. The host runs the one matching the environment; it never falls back to the other. Expose one cross-platform script (Node, Python, pwsh) through both entries when possible. |
| `cwd` | Working directory, relative to the repository root. |
| `timeoutSec` | Default 30. |
| `env` | Static settings passed as environment variables, not in the payload. |
| `matcher` | Filters by tool name (`bash`, `powershell`, `edit`, `create`). Reported working in Copilot CLI; keep an in-script filter as fallback for other surfaces. |

**Events.** `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `errorOccurred`, `agentStop`.

**Payload.** JSON on stdin. Tool events carry `toolName` and `toolArgs`. `toolArgs` is a JSON **string**: parse it a second time.

```bash
payload="$(cat)"
tool_args="$(printf '%s' "$payload" | jq -r '.toolArgs // "{}"')"
command="$(printf '%s' "$tool_args" | jq -r '.command // ""' 2>/dev/null || true)"
```

**Output.**

| Event | Allow | Block |
| --- | --- | --- |
| `preToolUse` | exit 0, empty stdout | exit 0 with `{"permissionDecision":"deny","permissionDecisionReason":"…"}` on stdout (preferred, gives a reason); a non-zero exit also blocks, without a reason |
| `userPromptSubmitted`, `agentStop` | exit 0 | non-zero exit |
| others | exit 0 | non-zero exit signals failure; later hooks for the event may be skipped |

Stderr is for diagnostics. Bash scripts that parse JSON need `jq`; PowerShell needs nothing extra.

## Claude Code

**Location.** In a project: the `hooks` key of `.claude/settings.json` (or `~/.claude/settings.json` for every project); script paths can use `"$CLAUDE_PROJECT_DIR"`. In a plugin: `hooks/hooks.json`, with scripts referenced through `${CLAUDE_PLUGIN_ROOT}`.

**Config.** Events map to matcher groups, each with its own `hooks` list:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/check.cjs"], "timeout": 5 }
        ]
      }
    ]
  }
}
```

`matcher` is a regex over tool names (`Edit|Write|MultiEdit`). Running the script as `node` with `args` makes the same file work on every OS without a shell or `jq`; that is this collection's convention.

**Events** include `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `Notification`, `PreCompact` and `SessionEnd`.

**Payload.** JSON on stdin with `tool_name` and `tool_input` (an object, e.g. `tool_input.command`, `tool_input.file_path`), plus `cwd`.

**Output.**

| Goal | How |
| --- | --- |
| Block a tool call | exit 2; the stderr text is shown to the agent |
| Add context at session start | print it on stdout from a `SessionStart` hook |
| Add context after a tool call | stdout `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"…"}}` |
| Show the user a message the agent does not see | stdout `{"systemMessage":"…"}` |
| Allow | exit 0 |

Test by piping a sample event: `echo '{"cwd":"/repo","tool_name":"Bash","tool_input":{"command":"git push"}}' | node check.cjs`.

## OpenAI Codex

**Location.** `.codex/hooks.json`, enabled with `[features] codex_hooks = true` in `.codex/config.toml`.

**Events.** `SessionStart` (matches `startup` and `resume`), `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`.

**Differences from Claude Code** (from OpenAI's migration reference, checked 2026-04-20):

- `PreToolUse` and `PostToolUse` currently run for shell commands only. Checks Claude Code ties to `Edit`/`Write` belong in a `Stop` hook.
- `PreToolUse` blocks only on `permissionDecision: "deny"`, legacy `decision: "block"`, or exit code 2.
- `PostToolUse` `decision: "block"` becomes feedback to the model; `continue: false` stops execution.
- `UserPromptSubmit` can inject context or block the prompt; it ignores `matcher`.
- `Stop` ignores `matcher` and can request a continuation prompt.
- Only `type: "command"` hooks run; `prompt`, `agent`, HTTP and async hooks are skipped.
- No equivalent for `PermissionRequest`, `SubagentStart`, `SubagentStop`, `PreCompact`, `SessionEnd` and similar events.
- Codex reads hooks from its config layers, not from skills, agents or plugins.

## Porting a hook

1. Write the policy once: condition, mode, messages, fail-open rule.
2. Map the event per host using the tables above. Drop a host that lacks the event and say so in the README.
3. Map the payload fields (`toolArgs` string vs `tool_input` object).
4. Map the block channel (stdout JSON vs exit 2).
5. Test each implementation with the same sample cases: allowed, denied, malformed.
