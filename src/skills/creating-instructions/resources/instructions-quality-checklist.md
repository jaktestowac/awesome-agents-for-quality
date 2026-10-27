# Instructions Quality Checklist

Run this before handing off an instructions file or rule.

## Scope and placement

- [ ] The type matches the scope: repository-wide file for what matters in nearly every task, scoped rule for a file pattern.
- [ ] The scope is as narrow as the content allows; no `**` without a stated reason.
- [ ] The file sits where each target host reads it (see `host-instruction-formats.md`).
- [ ] For Codex, scoped rules are either in a folder's `AGENTS.md` or indexed from the root `AGENTS.md`.
- [ ] File names are descriptive and kebab-case.

## Rule quality

- [ ] Every bullet is imperative and checkable in a diff.
- [ ] Rules, not workflows: no step sequences or triggers.
- [ ] Surprising rules carry their reason in the same bullet.
- [ ] Repository-specific, not generic advice the model already follows.
- [ ] Nothing restates lint, formatter or type-checker behaviour.
- [ ] No history, incident numbers or "now works differently".

## Examples

- [ ] Preferred/avoided pairs appear only where the rule is easy to misread.
- [ ] Each example actually demonstrates the rule next to it.

## Separation of concerns

- [ ] No agent persona or role.
- [ ] No command workflow or skill procedure.
- [ ] No rule duplicated in another file covering the same files; a deliberate override names what it overrides.

## Host fit

- [ ] **This collection:** `src/rules/<name>.md` has only `description` and an `applyTo` list, and `npm run validate` passes without an `applyTo` warning.
- [ ] **A user's project:** frontmatter matches the host (`applyTo` string for Copilot, `paths` list for Claude Code, none for Codex), and a test edit to a matching file picked the rule up.

## Smells that call for a rewrite

- `applyTo: '**'` for advice that matters in one folder
- paragraphs longer than the rules they support
- examples copied from docs that do not match the repository's patterns
- one file governing several unrelated audiences
