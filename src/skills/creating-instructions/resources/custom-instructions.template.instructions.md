---
description: '<What these rules cover>, for <files or folder>.'
applyTo: '<narrow glob>, <second glob if needed>'
---

<!--
Copilot format (.github/instructions/<name>.instructions.md). For Claude Code (.claude/rules/<name>.md), replace
the frontmatter with a `paths:` list of the same globs. For Codex, drop the frontmatter, save the body as
.agents/rules/<name>.md and add a row to the AGENTS.md index. For this collection (src/rules/<name>.md), keep
`description` and make `applyTo` a YAML list. See host-instruction-formats.md. Delete this comment.
-->

## Rules

- <Imperative, checkable rule> because <reason, only if not obvious>.
- <Imperative, checkable rule>.
- Put `<artifact type>` in `<location>`; name it `<convention>`.

### Preferred

```ts
// Project-specific example of the rule above. Include a pair only when the rule is easy to misread.
```

### Avoid

```ts
// The pattern the rule replaces.
```

## Pointers

- Run `<npm run ...>` to check changes in these files.
- Existing examples to copy: `<path>`.
