# Skill Quality Checklist

Run this before handing off a skill. Every box should be provable from the files, a command result or a trigger test.

## Name and description

- [ ] Folder name and frontmatter `name` match exactly; lowercase letters, digits and single hyphens, max 64 characters.
- [ ] The name describes an activity (`analyzing-test-reports`), not a topic (`reports`).
- [ ] The description says what the skill does, in the third person, starting with a verb.
- [ ] The description has a `Use when …` clause with intent categories, not a growing list of synonyms.
- [ ] The nearest neighbour is routed by its exact name when one exists.
- [ ] The description does not summarise the workflow.
- [ ] Three requests that should trigger it would match; two near-misses would not.

## Body

- [ ] Under 500 lines.
- [ ] Teaches a procedure; every step ends in a checkable completion criterion.
- [ ] Loops have a cap and say what to do when it is hit.
- [ ] Constraints carry their reason instead of capitalised MUST/NEVER.
- [ ] The output shape is pinned (template, path or sections) where it matters.
- [ ] No explanation of things the model already knows.
- [ ] Names capabilities ("run the focused test"), not one host's tool names.
- [ ] Has Related Skills and a Definition of Done.

## Supporting files

- [ ] One level deep from `SKILL.md`, descriptive file names.
- [ ] Each one is linked from the body with a "read when …" condition.
- [ ] Nothing is duplicated between the body and a supporting file.
- [ ] Real files, not symlinks.

## Fit with other assets

- [ ] Not a persona (that is an agent), not a one-shot command (that is a prompt), not always-on rules (those are instructions).
- [ ] Does not compete with an existing skill for the same requests.

## Host fit

- [ ] Frontmatter holds only `name`, `description` and keys every target host accepts; host-only keys appear only when that host is the sole target.
- [ ] **This collection:** keys are within `CONTRIBUTING.md`, the skill is in exactly one bundle in `bundles.yaml`, the body names no host unless the skill is about hosts, and `npm run validate` passes. No file under `plugins/` was edited.
- [ ] **A user's project:** the folder sits in the host's skill location; for Codex, `agents/openai.yaml` matches the skill if present.

## Smells that call for a rewrite

- a name like `helpers`, `best-practices` or `playwright`
- a description that never says when to use the skill
- a body over 500 lines with no supporting files
- a workflow made of slogans ("ensure quality") instead of actions
