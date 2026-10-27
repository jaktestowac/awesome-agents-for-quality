---
name: creating-instructions
description: "Creates instruction files and scoped rules that agents apply automatically: repository-wide guidance (`copilot-instructions.md`, `CLAUDE.md`, `AGENTS.md`) and file-scoped rules (Copilot `.instructions.md` with `applyTo`, Claude Code `.claude/rules/` with `paths`, Codex `AGENTS.md`), plus rules in this collection's single-source format. Use when encoding project conventions, choosing how narrowly a rule should apply, splitting an overgrown instructions file, or porting rules from one tool to another. For step-by-step workflows, use `creating-skills`; for enforcement that must not depend on the model, use `creating-hooks`."
argument-hint: "Repository context, target files or folders, the conventions to encode, and which tools the team uses"
user-invocable: true
---

# Creating Instructions and Rules

Instructions are standing rules the agent reads without being asked. Every always-loaded line costs context on every turn, and every rule competes with the task for attention, so the job is to say little, scope it tightly, and make each line checkable.

All three hosts have repository-wide instructions. Copilot and Claude Code also scope rules to file patterns natively; Codex does not (it scopes by folder with nested `AGENTS.md` files), so a glob-scoped rule needs a workaround there.

## Where you are writing

| Writing for | Source | Scope | Check |
| --- | --- | --- | --- |
| **This collection** | `src/rules/<name>.md` with `description` and an `applyTo` list (see the repository's `CONTRIBUTING.md`, "Rule frontmatter") | `applyTo` globs; the validator warns on `**` | `npm run validate`. Rules belong to no bundle; the build publishes each one under `rules/<host>/` |
| **A user's project** | The host's files, see [Per-host summary](#per-host-summary) | The host's mechanism | Edit a matching file and confirm the rule was applied |

## What makes a good rule

- **Scoped as narrowly as the content allows.** `tests/e2e/**/*.spec.ts`, not `**`. Repository-wide files hold only what matters for nearly every task.
- **Imperative and checkable.** Each bullet can be verified in a diff: "Use `getByRole` before `getByTestId`", not "write clean tests".
- **Rules, not workflows.** No step sequences or triggers; those belong in commands and skills.
- **A reason where the rule is surprising**, in the same bullet.
- **A preferred/avoided pair only where the pattern is easy to misread.**
- **Don't cache the environment.** Point at config, scripts and `--help` instead of restating them; write down the unwritten convention and why it exists.
- **Not what a tool already enforces.** If the linter or formatter catches it, leave it out, or better, move a prose rule into a lint rule or hook.
- **One topic, one file.** A deliberate override names the rule it overrides.
- **No history.** No "we used to", incident numbers, or "now works differently".

## Workflow

### 1. Frame

Settle: repository-wide or scoped; which files or folders; which tools the team uses; who installs it (one person, the team, a public collection). Collect only conventions stable enough to outlive the current task.

### 2. Gather

Read existing instructions, README, lint and formatter config, and a few representative files. Separate what tools enforce from what still needs judgment. Done when each candidate rule has an example in the codebase or a stated reason.

### 3. Choose the shape

- Applies to nearly every task → the repository-wide file.
- Applies to a file pattern → a scoped rule.
- Two audiences would inherit each other's rules → split the file.

### 4. Write

Use the templates in the resource map. Keep each rule to one or two lines; add an example pair only for non-obvious patterns.

### 5. Validate

- Run [`resources/instructions-quality-checklist.md`](resources/instructions-quality-checklist.md).
- This collection: `npm run validate` passes with no `applyTo` warning.
- A user's project: open or edit one matching and one non-matching file, and confirm the rule applied to the first only. In Codex, confirm the agent followed the index to the rule file.

## Per-host summary

| | GitHub Copilot | Claude Code | OpenAI Codex |
| --- | --- | --- | --- |
| Repository-wide | `.github/copilot-instructions.md` | `CLAUDE.md` | `AGENTS.md` (nested `AGENTS.md` files apply to their subtree) |
| Scoped rule | `.github/instructions/<name>.instructions.md` | `.claude/rules/<name>.md` | No glob-scoped rules |
| Scope key | `applyTo: '<glob>, <glob>'` (one comma-separated string) | `paths:` (a YAML list of globs) | Folder placement, or an index (below) |
| Other frontmatter | `description` | none needed | none |

Codex workaround used by this collection: put each rule in `.agents/rules/<name>.md` and add a table to `AGENTS.md` that tells the agent which rule file to read before touching which files. OpenAI documents a 32 KiB combined size limit for `AGENTS.md`, another reason to keep rules out of it and indexed instead.

Formats, examples and sources: [`resources/host-instruction-formats.md`](resources/host-instruction-formats.md) (read it when writing for a user's project or porting rules between tools).

## Common failure modes

- `applyTo: '**'` (or an unscoped `CLAUDE.md` section) for advice that matters in one folder
- a tutorial instead of a rule set
- copying linter or formatter defaults
- several unrelated audiences in one file
- rules with no reason where the reason is not obvious
- one rule repeated in the repository-wide file and a scoped file, drifting apart

## Resource map

- [`resources/copilot-instructions.template.md`](resources/copilot-instructions.template.md): repository-wide file scaffold, usable as `copilot-instructions.md`, `CLAUDE.md` or `AGENTS.md`. Read when writing the repository-wide file.
- [`resources/copilot-instructions.example.md`](resources/copilot-instructions.example.md): a finished repository-wide file for a test automation repository.
- [`resources/custom-instructions.template.instructions.md`](resources/custom-instructions.template.instructions.md): scoped rule scaffold. Read when writing a scoped rule.
- [`resources/custom-instructions.example.instructions.md`](resources/custom-instructions.example.instructions.md): a finished scoped rule for Playwright fixtures.
- [`resources/host-instruction-formats.md`](resources/host-instruction-formats.md): the same rule in each host's format, plus this collection's source format.
- [`resources/instructions-quality-checklist.md`](resources/instructions-quality-checklist.md): final review. Read before handing off.

## Related Skills

- `creating-skills`: for procedures and workflows that do not belong in rules
- `creating-hooks`: when a rule must be enforced, not just stated
- `creating-prompts`: for a task the user starts on purpose
- `creating-custom-agents`: when the guidance is really a role with its own tools

## Definition of Done

- Each file has one audience; repository-wide content applies to nearly every task.
- Every scoped rule matches only the files it is about.
- Every bullet is imperative and checkable; surprising rules carry a reason.
- Nothing restates lint or formatter behaviour or another rule file.
- This collection: `src/rules/<name>.md` has `description` and a narrow `applyTo` list, and `npm run validate` passes. A user's project: files sit where each target host reads them, and a matching edit picked up the rule.
