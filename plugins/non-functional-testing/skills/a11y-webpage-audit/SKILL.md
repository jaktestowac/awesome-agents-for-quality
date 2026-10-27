---
name: a11y-webpage-audit
description: Audits one webpage for accessibility, maps each issue to WCAG 2.1/2.2 AA, and gives reproduction steps, fixes, and retest steps. Use when a single page, component, or pull-request preview needs a quick accessibility check before merge or release. For multi-page journeys, template sampling, or stakeholder-ready reporting, use the a11y-audit-deep-dive command.
argument-hint: "[url]"
disable-model-invocation: true
---

# A11y webpage audit (single URL)

## Inputs

Take these from what the user typed after the command, or from the conversation. Ask for any you need that are missing.

- `url`: URL of the page to audit (must be a site you are authorized to test)

# Task

Audit the page at <url> for accessibility and produce a structured Markdown report.

If no URL is provided, ask for one and stop until you have it. If the page needs login, ask for a test account or a saved auth state; do not guess credentials.

Use the Playwright MCP tools to load and interact with the page.

## Scope

- WCAG 2.1/2.2 Level AA criteria most likely affected on a webpage: contrast, semantics, keyboard, focus, forms, reflow/zoom, motion.
- Recommend native HTML semantics first; recommend ARIA only where native semantics cannot do the job.
- Name common violations with axe-core rule vocabulary.
- If tool output is available (axe, Pa11y, Lighthouse), normalize it into the report, and confirm each item on the page rather than copying it.

## Steps

Check in this order:

1. Static review: semantic HTML, landmarks, headings, labels.
2. Keyboard pass: tab order, visible focus, keyboard traps, skip links.
3. Dynamic content: dialogs, menus, live regions.
4. Visual pass: contrast, zoom and reflow at 400%, motion.
5. Forms and errors: labels, instructions, validation messages.
6. Programmatic names, roles, and states of controls.

For each issue record: description, why it matters (who is affected and how), how to reproduce, proposed fix (with a code snippet where useful), WCAG reference, and how to verify the fix. Take a screenshot of the issue where it helps, with the affected element outlined.

## Output (Markdown)

- **Summary**: page `<url>`, overall risk (High/Medium/Low), count of issues by severity.
- **Findings by WCAG criterion**: one block per issue with the fields above. Use the exact official success criterion name.
- **Issue table**:

| ID  | WCAG | Component / Selector | Severity | Description | Proposed Fix |
| --- | ---- | -------------------- | -------- | ----------- | ------------ |

- **Not checked**: anything you could not assess automatically (screen reader output, cognitive load), so nobody reads the report as complete coverage.

## Guardrails

- Audit only sites the user owns or is authorized to test.
- Do not submit forms, send messages, or change account data without explicit confirmation; inspect validation by tabbing and reading, not by creating real records.
- Report what you observed. If a finding comes from a tool and you could not confirm it on the page, label it unconfirmed.
- Stop after the six passes above. For more pages or a full journey, hand off to the `a11y-audit-deep-dive` command.

## References

- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
