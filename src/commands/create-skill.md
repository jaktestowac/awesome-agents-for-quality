---
name: create-skill
title: Create a new skill
description: Creates a new agent skill (a SKILL.md folder with supporting resources) for GitHub Copilot, Claude Code and OpenAI Codex, either as a contribution to this collection or in the user's own project, and validates it. Use when you want a guided, step-by-step build of one skill; for the underlying method, see the `creating-skills` skill.
inputs:
  capability: what the skill should do and the requests that should trigger it
  target: "where it goes: this collection, or a project and host such as .github/skills, .claude/skills or .agents/skills (default: ask)"
---

Create one new skill for {{capability}}, placed according to {{target}}. Follow the `creating-skills` skill if it is available; the steps below are the short form.

## Steps

1. **Settle the target.** If {{target}} is missing, ask: "Is this a contribution to this collection, or a skill for your own project? If your project, which tools does your team use?" Do not continue until it is answered.
   - This collection: the source goes in `src/skills/<name>/`, supporting files in `resources/`, frontmatter limited to the keys in `CONTRIBUTING.md`.
   - A user's project: `.github/skills/<name>/` (Copilot), `.claude/skills/<name>/` (Claude Code), `.agents/skills/<name>/` (Codex). For several hosts, pick one location and keep frontmatter to `name` and `description`.
2. **Settle the capability.** If {{capability}} does not say what the skill produces and when it should trigger, ask one question at a time until it does. Then list the existing skills nearby (`ls` the skills folder) and name the closest one. If an existing skill already covers it, stop and recommend editing that skill instead.
3. **Write the name and description first.** Name: an activity in gerund form, lowercase with hyphens, max 64 characters, equal to the folder name. Description: what it does, `Use when …` with intent categories, and a routing clause for the closest neighbour. Show both to the user and wait for approval before writing files.
4. **Write the files.** Create `SKILL.md` from the `creating-skills` template: purpose, when not to use, workflow with a checkable criterion per step, output format, resource map with "read when" conditions, Related Skills, Definition of Done. Add at most the supporting files that remove ambiguity (usually one template or checklist).
5. **Verify.**
   - This collection: add the skill to exactly one bundle in `bundles.yaml`, run `npm run validate`, and fix every error and every warning about the new skill. Do not run `npm run build` unless the user asks; it rewrites generated files.
   - A user's project: check the folder name matches `name`, the body is under 500 lines and every linked file exists. If the project uses Codex and an `agents/openai.yaml` is wanted, write it next to `SKILL.md`.
   - Either way: list three requests that should trigger the skill and two near-misses that should not, and say which wording in the description decides each.

## Output

Reply with:

- the files created, one path per line
- the final `name` and `description`
- the validation result (command output, or the checks above with pass/fail)
- the trigger and near-miss requests to try in a fresh session

## Guardrails

- Never edit anything under `plugins/`, `rules/` or `catalog/` in this collection; those are generated.
- Never overwrite an existing skill folder. If the name is taken, propose another.
- Never name a host in the body of a skill for this collection unless the skill is about hosts; the validator warns on it.
- Stop after two failed validation rounds and report the remaining errors instead of guessing further.

Next: start a fresh session and try the first trigger request.
