---
name: <activity-name>
description: '<Verb>s <what the skill produces or does>. Use when <intent category>, <intent category>, or <situation>, even if the user does not say "<obvious keyword>". For <near neighbour job>, use `<other-skill>`.'
argument-hint: '<What the user should provide>'
---

<!--
Frontmatter: `name` and `description` work in every host. `argument-hint` is optional (Claude Code reads it,
and this collection allows it). Drop it, or add host-only keys, only when you know the target host.
Delete this comment.
-->

# <Human-friendly skill title>

<One or two sentences: the job this skill does and the artifact it produces.>

## When not to use

- <near-miss request> - use `<other-skill>` instead
- <situation where the skill would do harm or waste effort>

## Workflow

### 1. <Frame the task>

- <what to read or ask first; ask one question at a time, only when the answer changes the result>
- Done when: <checkable condition, e.g. "the scope, inputs and output path are known">

### 2. <Do the main work>

- <the default approach, with the reason for any non-obvious rule beside it>
- <exact command for a fragile step: `npm run <script>`>
- Done when: <checkable condition>

### 3. Validate

- <command or check the agent runs, and what passing looks like>
- If it still fails after <N> attempts: <stop, report what was tried, and what is needed>

## Output

<The exact shape of the deliverable: a template, the file path it is written to, or the sections of the reply.>

```markdown
## <Section>
- <field>: <value>
```

## Resource map

- `resources/<template>.md`: <what it holds>. Read when <condition>.
- `resources/<checklist>.md`: <what it holds>. Read before handing off.

## Related Skills

- `<other-skill>`: <when to reach for it instead of, or after, this one>

## Definition of Done

- <criterion a reviewer can check from the output, a command result or a file>
- <criterion>
- <criterion>
