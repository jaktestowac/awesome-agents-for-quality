# Hook Template Pack

Starting point for one hook with a Copilot and a Claude Code implementation. Replace placeholders, delete the host you do not target, and keep the policy as small as possible. Event names, payloads and outputs per host: `host-hook-formats.md`. Codex uses `.codex/hooks.json` and supports fewer events; adapt from the Claude Code version and re-check the Codex docs.

In this collection the same files go in `src/hooks/<name>/`: `hook.yaml`, `copilot/` (the `hooks.json` and scripts below) and `claude/` (`hooks.json` and the `.cjs` script). See the repository's `CONTRIBUTING.md`.

## `README.md`

```md
# <Hook title>

<What it does> so that <why it matters>.

## Behaviour

- Event: Copilot `<preToolUse>`, Claude Code `<PreToolUse>`
- Applies to: <tools, e.g. shell commands>
- Mode: <observe | add context | warn | deny>
- Timeout: <seconds>
- On missing or malformed input: allow (exit 0)

## Install

- Copilot: copy this folder to `.github/hooks/<hook-name>/`. Bash needs `jq`; PowerShell needs nothing extra.
- Claude Code: merge `claude/hooks.json` into `.claude/settings.json`, or install the plugin. Needs Node.js.

## When it blocks

<What the user and the agent see, and what to do instead.>

## Limits

<Known false positives, hosts or events not covered.>
```

## Copilot: `hooks.json`

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/<hook-name>/<script>.sh",
        "powershell": "./.github/hooks/<hook-name>/<script>.ps1",
        "cwd": ".",
        "timeoutSec": 10
      }
    ]
  }
}
```

## Copilot: `<script>.sh`

```bash
#!/usr/bin/env bash
# Fail open: any parse problem means allow.
payload="$(cat)" || exit 0
tool_name="$(printf '%s' "$payload" | jq -r '.toolName // ""' 2>/dev/null)" || exit 0
[ "$tool_name" = "<tool>" ] || exit 0
# toolArgs is a JSON string; parse it a second time.
args="$(printf '%s' "$payload" | jq -r '.toolArgs // "{}"' 2>/dev/null)" || exit 0
value="$(printf '%s' "$args" | jq -r '.<field> // ""' 2>/dev/null)" || exit 0

if <condition on "$value">; then
  jq -cn --arg r "<Plain reason and the safe alternative.>" \
    '{permissionDecision:"deny",permissionDecisionReason:$r}'
fi
exit 0
```

## Copilot: `<script>.ps1`

```powershell
try {
  $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
  if ($payload.toolName -ne '<tool>') { exit 0 }
  $toolArgs = $payload.toolArgs | ConvertFrom-Json   # toolArgs is a JSON string
  $value = [string]$toolArgs.<field>
} catch { exit 0 }

if (<condition on $value>) {
  @{ permissionDecision = 'deny'; permissionDecisionReason = '<Plain reason and the safe alternative.>' } |
    ConvertTo-Json -Compress
}
exit 0
```

## Claude Code: `hooks.json`

In a plugin this is `hooks/hooks.json`; in a project, merge the `hooks` object into `.claude/settings.json` and use `"command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/<script>.cjs"` instead of `command` + `args`.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "<ToolName>",
        "hooks": [
          { "type": "command", "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/hooks/<script>.cjs"], "timeout": 10 }
        ]
      }
    ]
  }
}
```

## Claude Code: `<script>.cjs`

```js
// Fail open: any problem reading the event means allow.
let event;
try {
  event = JSON.parse(require('fs').readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}
const value = String(event?.tool_input?.<field> ?? '');

if (<condition on value>) {
  process.stderr.write('<Plain reason and the safe alternative.>\n');
  process.exit(2); // exit 2 blocks the tool call; stderr reaches the agent
}
process.exit(0);
```

## Notes

- Start in observe mode (log to stderr or a file) before switching to deny.
- Keep patterns in `env` (Copilot) or a shared config file so the same script can log in one repository and block in another.
- Test each script by piping sample payloads: allowed, denied, malformed.
