# Prompt and Command Quality Checklist

Run this before handing off a prompt file or command.

## Contract

- [ ] One job.
- [ ] The description says what it produces and when to run it.
- [ ] The target agent, if any, is named exactly and exists.
- [ ] Every input has a hint; optional inputs have a default.
- [ ] Required inputs have an ask-and-stop rule.
- [ ] The output has a format and, if saved, a path.

## Body

- [ ] Flow is why → context → inputs → steps → output → verification.
- [ ] Steps are numbered and each ends in something checkable.
- [ ] Loops have a cap and an escalation ("stop and report").
- [ ] Guardrails cover edits, deletes and bulk writes; bulk changes have a preview or confirmation.
- [ ] Ends with one concrete next action.

## Separation of concerns

- [ ] No persona or "Act as …" paragraph that adds no constraint.
- [ ] Procedures that belong in a skill are referenced by name, not copied.
- [ ] Rules that apply to all work are not repeated from instructions.
- [ ] `tools` / `allowed-tools` are set only with a concrete reason.

## Host fit

- [ ] A command meant for several hosts uses no host-only placeholder (`${input:…}`, `$ARGUMENTS`).
- [ ] **This collection:** `src/commands/<name>.md` uses only the keys in `CONTRIBUTING.md`; every `{{placeholder}}` is declared under `inputs` or is `selection`/`file`; an `agent:` target is in the same bundle; `npm run validate` passes.
- [ ] **A user's project:** the file is where the host reads it (`.github/prompts/`, `.claude/skills/` or `.claude/commands/`, `.agents/skills/` with `agents/openai.yaml`), and the model cannot start it on its own in Claude Code and Codex.

## Smells that call for a rewrite

- reads like a full system prompt
- inputs so vague that weak output is inevitable
- several unrelated outcomes behind one command
- tool overrides added "just in case"
