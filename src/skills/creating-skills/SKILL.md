---
name: creating-skills
description: "Creates agent skills (a `SKILL.md` folder plus optional resources) that load in GitHub Copilot, Claude Code and OpenAI Codex: a description that triggers on the right requests, a lean body with progressive disclosure, checkable steps, and a validation pass. Use when packaging repeatable know-how as a skill the agent picks up on its own, splitting a bloated SKILL.md into body plus resources, fixing a skill that fires on the wrong requests or never fires, or adding a skill to this collection, even if the user only says 'turn this into something reusable'. For a command the user runs on purpose, use `creating-prompts`; to test how an existing skill behaves, use `testing-agent-skills`."
argument-hint: "Capability to package, the requests that should trigger it, the expected output, and any reference material"
user-invocable: true
---

# Creating Skills

A skill is a folder with a `SKILL.md` and optional supporting files. All three hosts use the same open format ([agentskills.io](https://agentskills.io)) and the same loading model: the agent sees only `name` and `description` until a request matches, then reads the body, then opens supporting files only when the body points to them. Everything below follows from that.

## Where you are writing

Decide this first, because it changes the folder, the allowed frontmatter and the final check.

| Writing for | Source location | Frontmatter | Check |
| --- | --- | --- | --- |
| **This collection** | `src/skills/<name>/SKILL.md`, supporting files in `resources/` | Only the keys listed in the repository's `CONTRIBUTING.md` ("Skill frontmatter"); anything else fails validation | Add it to one bundle in `bundles.yaml`, then `npm run validate` |
| **A user's own project** | The host's skill folder, see [Per-host summary](#per-host-summary) | `name` + `description`, plus host-specific keys only when that host is the only target | The host's own validator if it has one, then a live trigger test |

In this collection a skill must work in every host, so its body names no host unless the skill is about hosts (the validator warns otherwise). Never edit the copies under `plugins/`: `npm run build` regenerates them.

## What makes a skill work in every host

**The description is the trigger.** It is the only text loaded before activation, so it carries both halves:

- what the skill does, in the third person, starting with a verb ("Analyzes…", "Generates…")
- `Use when …` with intent categories, not a list of synonyms. Lean slightly broad ("…even if the user does not say X"), because models undertrigger
- one clause routing a near neighbour by its exact name, when one exists
- no workflow summary: an agent that reads the steps in the description may follow them and skip the body

**Name the activity, not the topic.** `analyzing-test-reports`, not `reports`. Lowercase letters, digits and single hyphens, max 64 characters, equal to the folder name. Gerund form is this collection's convention.

**Keep the body lean.** Under 500 lines. Inline what every run needs; move what only some runs need into supporting files one level deep, each linked with a "read when…" condition. A pointer without a condition gets read every time or never.

**Write for the agent, not about the topic.** Skip what the model already knows (what a unit test is). Keep what only the author knows: house conventions, the quality bar, tool quirks, hard judgment calls, and the reason behind each constraint. A reason beside a rule beats a capitalised MUST.

**Match freedom to fragility.** Exact commands for fragile steps; heuristics for judgment calls. End each step with something checkable ("run `npm test`, all pass", not "make sure it works"). Cap any loop and say what to do when the cap is hit.

**Pin the output shape when it matters.** Give a template for the deliverable; short, varied examples labelled as illustrations, not one gold answer the agent will copy.

**Scripts for repeated mechanics.** When every run re-derives the same code, ship it in `scripts/`. Scripts print results on stdout and diagnostics on stderr.

**Stay host-neutral in the body.** Describe capabilities ("run the focused test", "search the project"), not one host's tool names.

## Workflow

### 1. Frame the capability

Settle, from the request or by asking one question at a time:

- the job the skill performs and the artifact it produces
- the requests that should trigger it, and the near-miss requests that should not
- the nearest existing skills (in this collection: `ls src/skills`), and how this one differs

Stop and recommend another asset type when the need is not a skill: a command the user runs on purpose (`creating-prompts`), a standing role with its own tool limits (`creating-custom-agents`), rules that apply while editing certain files (`creating-instructions`), or enforcement that must not depend on the model (`creating-hooks`).

### 2. Draft the description first

Write it before the body. Read it back against three requests that should trigger it and two near-misses that should not. If a near-miss would match, add the routing clause.

### 3. Plan the folder

```
<skill-name>/
├── SKILL.md          required
├── resources/        templates, examples, checklists, references (this collection's convention)
├── scripts/          optional: repeated deterministic work
└── assets/           optional: files copied into the output
```

Start with the body and one template or checklist. Add a file only when it removes ambiguity or repetition.

### 4. Write the body

Use [`resources/SKILL.template.md`](resources/SKILL.template.md). A body usually has: a short purpose paragraph, when **not** to use it and where to go instead, the workflow with completion criteria, the output format, a resource map with "read when" conditions, Related Skills, and a Definition of Done.

A "When to Use" list in the body does nothing once the skill has triggered; put triggers in the description.

### 5. Validate

- Run the checklist: [`resources/skill-quality-checklist.md`](resources/skill-quality-checklist.md).
- In this collection: `npm run validate` passes with no warning for the new skill.
- In a user's project: run the host's validator where one exists (see the host reference), then try three triggering requests and two near-misses in a fresh session.
- For behaviour that must not regress, hand off to `testing-agent-skills`.

## Per-host summary

The same folder works in all three hosts. Only the install location and the optional extras differ. Details, sources and examples: [`resources/host-skill-formats.md`](resources/host-skill-formats.md) (read it when writing for a user's project or using host-specific keys).

| | GitHub Copilot | Claude Code | OpenAI Codex |
| --- | --- | --- | --- |
| Project folder | `.github/skills/<name>/` | `.claude/skills/<name>/` | `.agents/skills/<name>/` |
| Personal folder | `~/.copilot/skills/<name>/` | `~/.claude/skills/<name>/` | `~/.agents/skills/<name>/` |
| Run by hand | `/name` | `/name` | `$name` |
| Host-specific extras | `license` documented besides `name` and `description` | Frontmatter such as `allowed-tools`, `argument-hint`, `user-invocable`, `disable-model-invocation` | `agents/openai.yaml` for UI metadata and `policy.allow_implicit_invocation`; frontmatter kept to `name` + `description` |

All three also load skills from installed plugins (`creating-plugins`). Install a skill by one route only: one copied by hand and also installed as a plugin loads twice.

## Common failure modes

- a topic name (`playwright`, `security`) instead of an activity
- a description that says what the skill is about but never when to use it
- the workflow restated in the description
- a long theory document instead of a procedure with checkable steps
- templates pasted inline until the body passes 500 lines
- several loosely related jobs in one skill because they feel adjacent
- host-only frontmatter in a skill meant for every host

## Resource map

- [`resources/SKILL.template.md`](resources/SKILL.template.md): scaffold for a new `SKILL.md`. Read when starting the body.
- [`resources/SKILL.example.md`](resources/SKILL.example.md): a compact finished skill. Read when unsure about tone or scope.
- [`resources/skill-quality-checklist.md`](resources/skill-quality-checklist.md): final review. Read before handing off.
- [`resources/host-skill-formats.md`](resources/host-skill-formats.md): per-host locations, frontmatter support, invocation and Codex `agents/openai.yaml`. Read when the skill targets a user's project or one host.

## Related Skills

- `creating-prompts`: when the user should start the workflow on purpose rather than the agent picking it up
- `creating-custom-agents`: when the work needs a standing role with its own tool limits
- `creating-instructions`: for rules that apply automatically while editing matching files
- `creating-plugins`: to ship the skill as an installable plugin
- `testing-agent-skills`: to check triggering and output with activation and near-miss cases
- The `create-skill` command walks through this skill step by step; `audit-collection-health` reviews a whole collection.

## Definition of Done

- The folder name equals `name`, and `name` names an activity.
- The description states what and when, routes the nearest neighbour, and summarises no workflow.
- The body is under 500 lines, every step ends in a checkable criterion, and every supporting file is linked with a "read when" condition, one level deep.
- At least one template or checklist exists where the output shape matters.
- In this collection: the skill is in one bundle, the body names no host (unless it is about hosts), and `npm run validate` passes. In a user's project: the folder sits in the host's skill location and triggered on the test requests in a fresh session.
