---
name: a11y-audit-deep-dive
title: Accessibility audit - deep dive
description: Runs a structured accessibility audit of a page, a sampled set of templates, or a user journey, with findings mapped to WCAG 2.2 criteria, manual retest guidance, and technical or stakeholder-ready output. Use when a release, compliance review, or redesign needs more than a scanner pass, or when keyboard, focus, and dynamic-state behaviour across a flow must be checked. For a quick check of one URL, use the a11y-webpage-audit command.
agent: accessibility-expert
mcp: [playwright]
---

# Task

If the `auditing-accessibility` skill is installed, load it before starting.

Your goal is to perform a structured accessibility audit that goes beyond a quick scanner pass.

Ask for the minimum context you need:

- URL or user flow to audit
- auth details if the page is protected
- audit mode: quick triage, full page, or full journey
- output mode: technical report, business summary, or both
- compliance target, defaulting to WCAG 2.2 AA

If the requested scope covers more than one page, sample unique templates and critical journeys instead of pretending every page received the same depth of review.

When a live page is available:

1. Inspect the page or flow using Playwright for keyboard, focus, and interaction checks.
2. Review semantics, forms, dynamic states, zoom/reflow risks, and WCAG 2.2 additions such as target size and focus not obscured.
3. If automated tool output is available, normalize it into the report, but do not rely on it alone.
4. Deduplicate repeated findings and prioritize by user impact.
5. Produce:
   - a short summary
   - findings mapped to exact WCAG criteria
   - an issue table when technical detail is requested
   - quick wins vs structural fixes
   - a manual retest checklist
   - a stakeholder summary when the chosen output mode requires it

## Constraints

- Use the exact official WCAG 2.2 success criterion names.
- Do not report SC 4.1.1 Parsing.
- If confidence is low because a manual or assistive-technology check could not be completed, say so explicitly.
- Audit only sites the user owns or is authorized to test. Do not submit forms, complete purchases, or change account data without explicit confirmation; use test accounts.
- Stop when every sampled page or journey step has been reviewed, or when access (auth, environment) blocks further review; list what was not reviewed.

## Output format

Return Markdown only.
Use a technical report style that is actionable for both testers and developers.
