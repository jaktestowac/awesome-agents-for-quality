---
description: '<Verb>s <outcome>. Use when <situation>.'
name: '<command-name>'
agent: '<agent-name>'
argument-hint: '<what the user should type after the command>'
---

<!--
Copilot prompt-file format. For Claude Code, Codex, or this collection's src/commands/ format, keep the body
and swap the wrapper as shown in host-prompt-formats.md. In a body meant for every host, replace ${input:...}
with "take <input> from the user's message". Add `tools:` only if the default set is wrong. Delete this comment.
-->

# <Command title>

<One sentence: what this command produces and why it exists.>

## Inputs

- `${input:primary:<hint>}` - required. If missing, ask for it and stop.
- `${input:optional:<hint>}` - optional, default: <default>.

## Steps

1. <Read or gather the context the task depends on.> Done when <checkable condition>.
2. <Do the main work, routing to the `<skill-name>` skill for the method.>
3. <Verify: run `<command>` or check <criterion>.> If it fails <N> times, stop and report.
4. <Write the output to `<path>` / reply in the format below.>

## Output

```markdown
## <Section>
<shape of the result>
```

## Guardrails

- Never <destructive or out-of-scope action>.
- Ask before <editing more than N files / deleting / running against a shared environment>.

Next: <one concrete action for the user>.
