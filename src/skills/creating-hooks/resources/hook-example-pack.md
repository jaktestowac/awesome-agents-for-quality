# Hook Example Pack: Block Destructive Shell Commands

A conservative safety hook that blocks a few clearly destructive shell commands before they run, in Copilot and Claude Code. It is a pattern for dangerous-command protection, not a complete policy.

## `README.md`

```md
# Block destructive shell commands

Denies `rm -rf`, `git reset --hard`, `git clean -fd`, `del /s` and drive formats before they run.
Use it in shared workspaces where an accidental destructive command is costly.

## Behaviour

- Event: Copilot `preToolUse` (shell tools), Claude Code `PreToolUse` (matcher `Bash`)
- Mode: deny
- Timeout: 10 seconds
- On missing or malformed input: allow

## Install

- Copilot: copy this folder to `.github/hooks/block-destructive-shell/`. Bash needs `jq`.
- Claude Code: copy `block-destructive-shell.cjs` to `.claude/hooks/` and merge `claude/hooks.json` into `.claude/settings.json`. Needs Node.js.

## When it blocks

The agent is told which pattern matched and to use a narrower command or ask the user for an exception.

## Limits

Matches text only. A command built from variables or wrapped in a script is not caught.
```

## Copilot: `hooks.json`

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/block-destructive-shell/block-destructive-shell.sh",
        "powershell": "./.github/hooks/block-destructive-shell/block-destructive-shell.ps1",
        "cwd": ".",
        "timeoutSec": 10
      }
    ]
  }
}
```

## Copilot: `block-destructive-shell.sh`

```bash
#!/usr/bin/env bash
payload="$(cat)" || exit 0
tool="$(printf '%s' "$payload" | jq -r '.toolName // ""' 2>/dev/null)" || exit 0
case "$tool" in bash|powershell) ;; *) exit 0 ;; esac
args="$(printf '%s' "$payload" | jq -r '.toolArgs // "{}"' 2>/dev/null)" || exit 0
cmd="$(printf '%s' "$args" | jq -r '.command // ""' 2>/dev/null)" || exit 0

if printf '%s' "$cmd" | grep -Eiq 'rm[[:space:]]+-rf|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-fd|del[[:space:]]+/s|format[[:space:]]+[a-z]:'; then
  printf '%s\n' '{"permissionDecision":"deny","permissionDecisionReason":"Blocked a destructive shell command. Use a narrower command, or ask the user for an explicit exception."}'
fi
exit 0
```

## Copilot: `block-destructive-shell.ps1`

```powershell
try {
  $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
  if ($payload.toolName -notin @('bash', 'powershell')) { exit 0 }
  $cmd = [string](($payload.toolArgs | ConvertFrom-Json).command)
} catch { exit 0 }

if ($cmd -match '(?i)rm\s+-rf|git\s+reset\s+--hard|git\s+clean\s+-fd|del\s+/s|format\s+[a-z]:') {
  @{
    permissionDecision       = 'deny'
    permissionDecisionReason = 'Blocked a destructive shell command. Use a narrower command, or ask the user for an explicit exception.'
  } | ConvertTo-Json -Compress
}
exit 0
```

The tool names a Copilot surface uses for shell calls can differ; log `toolName` once in observe mode and adjust the filter.

## Claude Code: `hooks.json` (merged into `.claude/settings.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-destructive-shell.cjs", "timeout": 10 }
        ]
      }
    ]
  }
}
```

## Claude Code: `block-destructive-shell.cjs`

```js
let event;
try {
  event = JSON.parse(require('fs').readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}
const cmd = String(event?.tool_input?.command ?? '');
const danger = /rm\s+-rf|git\s+reset\s+--hard|git\s+clean\s+-fd|del\s+\/s|format\s+[a-z]:/i;

if (danger.test(cmd)) {
  process.stderr.write(`Blocked a destructive shell command (${cmd.match(danger)[0]}). Use a narrower command, or ask the user for an explicit exception.\n`);
  process.exit(2);
}
process.exit(0);
```

Test: `echo '{"tool_name":"Bash","tool_input":{"command":"git reset --hard"}}' | node block-destructive-shell.cjs; echo $?` prints the reason and `2`.

## Why this example works

- one narrow, high-confidence policy
- fails open on bad input in every script
- a reason the agent can act on
- the same policy implemented natively per host, not one script forced on both
