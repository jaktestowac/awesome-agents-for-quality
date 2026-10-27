# Hook Quality Checklist

Run this before handing off a hook.

## Fit

- [ ] A hook is needed: the behaviour must hold regardless of the model, at a lifecycle point.
- [ ] The event exists in every target host; uncovered hosts are named in the README.
- [ ] The policy is narrow and high-confidence.

## Behaviour

- [ ] Missing or malformed input exits 0 and allows.
- [ ] Runs well under its timeout; filters by tool name first.
- [ ] Deny and warn messages name the rule and the safe alternative.
- [ ] Uses each host's own block channel (Copilot stdout `permissionDecision`, Claude Code exit 2, Codex per its docs).
- [ ] Copilot scripts parse `toolArgs` as a JSON string.
- [ ] Started in observe or warn mode, or the block is justified by a stable policy.

## Pack completeness

- [ ] Config, scripts and README agree on event, mode, timeout and prerequisites (`jq`, Node.js, Python).
- [ ] Windows users are covered (`powershell` entry or a cross-platform runtime), or the README says they are not.
- [ ] Tested with allowed, denied and malformed sample payloads, plus one real trigger.

## Host fit

- [ ] **This collection:** `src/hooks/<name>/hook.yaml` lists `hosts`, there is one folder per listed host, the Claude Code script runs as `node` with `${CLAUDE_PLUGIN_ROOT}`, and `npm run validate` passes.
- [ ] **A user's project:** the config sits where the host reads it (`.github/hooks/`, `.claude/settings.json` or a plugin's `hooks/hooks.json`, `.codex/hooks.json` with the feature flag on).

## Smells that call for a rewrite

- broad deny logic with a vague message
- slow scripts on per-tool-call events
- a hook that blocks when it cannot parse its input
- one script assumed to work in every host
- undocumented prerequisites or side effects
