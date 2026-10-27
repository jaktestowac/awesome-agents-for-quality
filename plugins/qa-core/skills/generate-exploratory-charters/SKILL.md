---
name: generate-exploratory-charters
description: Creates prioritized, timeboxed exploratory testing charters (Explore / with / to discover) from a feature description, release notes, or a short pass over a live app, each with test ideas, oracles, and setup needs. Use when planning exploratory sessions for a release, a risky change, or a feature too new for scripted cases. For scripted step-by-step cases, use the manual-test-cases command.
argument-hint: "[target]"
disable-model-invocation: true
---

# Generate exploratory testing charters

## Inputs

Take these from what the user typed after the command, or from the conversation. Ask for any you need that are missing.

- `target`: feature description, release notes, user story, or app URL to explore

## Who does the work

Hand this task to the `test-planner` agent (`test_planner` in Codex). If that agent is not installed, do the task yourself, following the steps below.

# Task

Your goal is to produce session charters a tester can pick up and explore with immediately, instead of a generic "click around" instruction.

Ask only for missing essentials:

- what to explore: feature description, release notes, user story, or app URL <target>
- known risk areas, recent changes, or past bug hotspots
- available time budget and number of testers, if known
- personas or roles that matter

If a live URL is provided, take a short read-only reconnaissance pass with Playwright to ground the charters in the real UI. Explore only apps you are authorized to test, and do not submit forms or change data during reconnaissance; that is what the charters are for.

Then do the following:

1. Break the target into explorable areas and rank them by risk and uncertainty.
2. For each area, write a charter using the pattern: **Explore** _target_ **with** _resources/data/tools_ **to discover** _information goal_.
3. Enrich each charter with:
   - a suggested timebox (30/60/90 minutes)
   - concrete test ideas and heuristics to apply (boundaries, interruptions, state changes, roles, data variations)
   - oracle notes: how the tester will recognize a problem
   - setup needs: accounts, data, environment
4. Order the charters into a suggested session sequence for the available time budget.
5. End with what is deliberately not covered and which findings should feed back into `bug-report` or `manual-test-cases`.

## Output format

Return Markdown only.
Use one section per charter with a stable ID, priority, and timebox, so charters can be assigned and tracked individually:

```markdown
### CH-02 · P1 · 60 min
**Explore** checkout with an expired card and a slow network **to discover** how payment errors are reported and recovered.
- Test ideas: …
- Oracles: …
- Setup: …
```

Stop when the session sequence fills the time budget (or covers every high-risk area if no budget was given), and list the areas left out.
