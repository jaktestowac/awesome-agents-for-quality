---
name: reporting-bugs
description: 'Turns rough tester notes, screenshots, console output, or observed behavior into a reproducible bug report with severity, evidence, and follow-up guidance. Use when logging a bug or crash, triaging intermittent issues, or rewriting vague defect notes, and applies even when the user only describes what went wrong and asks to write it up for developers or a tracker such as Jira. To find the root cause of a failing test or defect, use diagnosing-test-failures.'
argument-hint: 'Observed behavior, expected behavior, steps, environment, evidence, and any reproduction notes'
user-invocable: true
---

# Reporting Bugs

Use this skill to turn messy observations into bug reports that developers can actually act on.

## When to Use

- write a bug report from rough notes or screenshots
- normalize findings from exploratory testing
- triage an intermittent or hard-to-reproduce issue
- rewrite a vague defect description into a developer-ready report
- capture product, accessibility, or automation defects in a consistent format

## Reporting Rules

- **Observation first** - describe what happened before discussing why it may have happened.
- **Reproduction beats opinion** - a calm, reproducible report is worth more than a dramatic summary.
- **Evidence should travel with the bug** - attach logs, screenshots, recordings, payloads, or selectors when available.
- **Severity follows impact** - grade the issue by user or business impact, not by frustration level.
- **Unknowns stay visible** - if confidence is low, say so clearly instead of bluffing.

## Workflow

### Phase 0: Gather the raw material

Collect what exists today:

- short summary of the problem
- environment and build details
- preconditions or setup state
- reproduction steps or triggering actions
- actual result
- expected result
- evidence such as screenshots, traces, logs, payloads, or timestamps

If critical pieces are missing, ask only for what is needed to make the report actionable.

### Phase 1: Normalize the reproduction story

Reduce the issue to a clean sequence:

1. starting state
2. user action or system trigger
3. observable result
4. expected result

If the issue is intermittent, capture the pattern explicitly:

- `always`
- `sometimes`
- `seen once`
- `not reproduced yet`

### Phase 2: Classify the issue

Record the metadata that routes it:

- **Category** - functional, data, auth, performance, accessibility, automation, or integration
- **Severity** - use `./resources/severity-matrix.md`
- **Confidence** - confirmed, likely, or suspected
- **Reproducibility** - always, intermittent, once, or unknown

State a root cause only when the evidence shows it. Suspicions, yours or the user's, go in a separate **Notes / Hypothesis** section, labelled as unconfirmed.

### Phase 3: Build the report

Use `./resources/bug-report-template.md` when possible.

The report includes:

- clear title with the broken behavior and surface
- environment block
- preconditions
- numbered steps to reproduce
- actual vs expected result
- severity with short justification
- evidence list
- missing evidence or follow-up questions if the report is still incomplete

### Phase 4: Add next-step guidance

When useful, end with one or more of these:

- suggested retest focus after the fix
- related areas that may also be affected
- test coverage that should be added or updated
- evidence still needed to confirm the defect fully

## Common Failure Modes

- reporting a symptom without a trigger
- skipping expected behavior and forcing the developer to guess the contract
- writing severity with no business or user impact explanation
- mixing multiple bugs into one ticket

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "It's obviously a race in the handler, I'll put that as the cause" | An unconfirmed cause sends the developer to the wrong place. Report the observation; put the theory under Notes / Hypothesis. |
| "I saw it once, the steps are probably these" | Reconstructed steps that do not reproduce waste the first hour of triage. Mark reproducibility `seen once` and list only the steps you actually took. |
| "This feels critical, I'll mark it High" | Severity grades user or business impact. Pick it from the severity matrix and write the one-line impact that justifies it. |
| "Expected behavior is obvious" | The developer may hold a different contract. State the expected result and where it comes from: spec, ticket, or previous behavior. |
| "The screenshot says it all" | Screenshots lose build, environment, and timing. Add the build, the environment, and a timestamp or log line next to it. |

## Red Flags

- A cause stated in the summary or title with no evidence cited for it.
- Steps to reproduce with no starting state, or with reproducibility left blank.
- A severity with no impact sentence.
- No expected result, or "should work" as the expected result.
- More than one broken behavior in a single report.
- Title wording that grades the bug ("critical", "major issue") instead of naming the broken behavior and where it occurs.

## Resource Map

- `./resources/bug-report-template.md` - default structure for the final bug report
- `./resources/severity-matrix.md` - impact-based severity rubric

## Related Skills

- `designing-functional-tests` - when the defect needs new manual coverage or regression updates
- `auditing-accessibility` - when the report is centered on WCAG or assistive-technology failures
- `requirements-test-coverage-mapper` - when a bug reveals a larger coverage gap against stated requirements
- `diagnosing-test-failures` - when the root cause is not yet known, or a failing test must be classified as app defect, test bug, or environment before reporting

## Definition of Done

This skill is complete when:

- the report states build and environment, preconditions, numbered steps, actual and expected results, with no reference to the chat it came from
- reproducibility is one of `always`, `sometimes`, `seen once`, or `not reproduced yet`, and steps not personally performed are marked as reported
- severity names its row in the severity matrix and gives a one-line user or business impact
- every evidence item is listed by file name, link, or log excerpt, and missing evidence is listed as a follow-up question
- any suspected cause sits under Notes / Hypothesis, not in the title or summary
- the report covers one broken behavior and is in the template's format, ready to paste
