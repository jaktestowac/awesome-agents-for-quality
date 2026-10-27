# Plugin README Template

For a plugin you publish from your own repository. In this collection, plugin READMEs are generated from `bundles.yaml`; improve the bundle description and the skills instead of editing `plugins/<name>/README.md`.

---

````markdown
# Exploratory Testing

Exploratory testing gets dismissed when nobody writes anything down. A charter that says what a session is for, a timebox that makes coverage countable, and notes taken during the session make it accountable. This plugin supplies all three and the debrief that routes what they find.

## What's inside

**Skills**

- `planning-exploratory-testing`: frame the mission, write and prioritise charters, run a timeboxed session, debrief.
  - `resources/charter-templates.md`: the explore/with/to-discover format and eight worked charters
  - `resources/heuristics-cheatsheet.md`: SFDIPOT, twelve named tours, and the oracles that turn an observation into a finding
  - `resources/session-notes-template.md`: in-session note format and a cross-session coverage summary
  - `resources/debrief-checklist.md`: the debrief and a routing table for every finding

**Commands**

- `generate-exploratory-charters`: drafts charters for a feature you name

## Install

| Tool | Commands |
| --- | --- |
| Claude Code | `/plugin marketplace add acme/agent-plugins`, then `/plugin install exploratory-testing@acme` |
| GitHub Copilot CLI | `copilot plugin marketplace add acme/agent-plugins`, then `copilot plugin install exploratory-testing@acme` |
| OpenAI Codex | `codex plugin marketplace add acme/agent-plugins`, then install it from the plugin list |

Run commands as `/name` in Claude Code and Copilot, `$name` in Codex.

## Prerequisites

None. <Or: MCP servers to configure, Node.js for hooks, agent files to copy for Codex.>

## Related

- `functional-test-design`: turns session findings into structured cases
- `bug-reporting`: for the defects a session produces
````

---

## Section rules

**Opening paragraph.** The problem, not the feature. A reader deciding whether to install asks whether they have this problem. "Exploratory testing gets dismissed when nobody writes anything down" names a situation; "This plugin provides exploratory testing capabilities" could describe anything.

**What's inside.** Every skill with one phrase, and under it every resource with a phrase saying what is in it, not the file name restated. "`heuristics-cheatsheet.md`: heuristics for exploratory testing" tells the reader nothing; "SFDIPOT, twelve named tours, and the oracles…" is the reason to install. List commands and agents too, and say which agents Codex users must copy by hand.

**Install.** One row per supported host, copied verbatim from a README that works. A divergent command in one README becomes a support question.

**Prerequisites.** MCP servers, runtimes, files to copy. A missing prerequisite looks like a plugin defect.

**Related.** Neighbouring plugins and when to use them instead. Two overlapping plugins should each say so.

## Leave out

| Do not write | Because |
| --- | --- |
| The skill's full workflow | It is in `SKILL.md` and will drift |
| A changelog | Git has it |
| Aspirational or "coming soon" content | It teaches readers the README is marketing |
