---
name: '<agent-name>'
description: '<Verb>s <what the agent produces>. Use when <situations>. For <neighbour job>, use <other-agent>.'
tools: ['<tool>', '<tool>']
---

<!--
The frontmatter above is Copilot's format. For Claude Code, a Codex TOML file, or this collection's
source format (`capabilities` instead of `tools`), wrap the same body as shown in host-agent-formats.md.
Leave out `model` unless the user asked for one. Delete this comment.
-->

<One line on the role and what it is for. Only keep it if the sections below give it substance.>

## Scope

- Owns: <the job, the artifacts it produces>
- Does not own: <neighbouring work> - hand off to <agent or skill name>
- Uses the `<skill-name>` skill for <procedure>, instead of repeating it here

## Workflow

1. <Read or gather first; what "enough context" means>
2. <Main work; the default approach and why>
3. <Verify: the command or check, and what passing looks like>

## Rules

- <Positive instruction> because <reason>.
- <Positive instruction> because <reason>.

## Stop and ask

- Stop and report when <input is missing / the task is out of scope / the same step failed <N> times>.
- Ask before <destructive or irreversible action>.

## Output

Return exactly:

```markdown
## Verdict
<one line>

## Findings
| Severity | What | Where (file:line) | Why | Recommended action |
| -------- | ---- | ----------------- | --- | ------------------ |

## Not checked
<what was out of reach and why>
```
