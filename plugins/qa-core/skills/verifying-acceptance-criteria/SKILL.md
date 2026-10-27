---
name: verifying-acceptance-criteria
description: 'Checks whether one build or feature meets its acceptance criteria (ACs), showing from implementation evidence which criteria are met, partial, missing, or untestable without inventing missing behavior. Use when checking whether a story is done, preparing QA sign-off, or turning criteria and observations into a verification matrix. For planning coverage across a whole PRD, use requirements-test-coverage-mapper; for linking existing tests to requirement IDs, use tracing-requirements-to-code.'
argument-hint: 'Acceptance criteria source, implementation evidence, environment, and any known assumptions or blockers'
user-invocable: true
---

# Verifying Acceptance Criteria

Use this skill when readiness depends on evidence rather than optimism.
It helps compare the stated contract of a feature with what the implementation actually proves today.

## When to Use

- verify a feature against acceptance criteria before sign-off
- review a build, PR, or live environment for readiness
- separate met requirements from partial or missing behavior
- expose criteria that are too vague to verify honestly
- prepare a QA-ready verification matrix for release or handoff

## Verification Rules

- **Source of truth must be explicit** - story, AC list, PRD slice, or ticket text.
- **Unclear criteria become `Untestable`** - name the ambiguity and ask, rather than inventing the behavior the criterion might mean.
- **One criterion, one verdict** - split compound criteria into atomic items before judging them.
- **Evidence beats intuition** - every verdict points to a `file:line`, a screenshot, an API response, a log line, or a named test run.
- **Partial is a valid status** - it is better than pretending a near-miss is complete.

## Workflow

### Phase 0: Gather both sides of the comparison

Collect:

- the acceptance criteria or equivalent source of truth
- implementation evidence such as code changes, screenshots, API responses, a running URL, or exploratory notes
- the environment or build under review

If either side is missing, ask for it before continuing.

### Phase 1: Normalize the criteria

Convert the input into atomic criteria with stable IDs such as `AC-001`, `AC-002`, and `AC-003`.

If a criterion mixes multiple expectations, split it.
If a criterion is vague, keep it but mark it as a likely `Untestable` candidate until evidence proves otherwise.

### Phase 2: Verify each criterion

Use these verdicts:

| Status | Meaning |
| --- | --- |
| Met | Evidence shows every part of the criterion working in the stated environment |
| Partial | Some of the criterion is implemented, but not all of it |
| Not Met | No convincing evidence of implementation exists |
| Untestable | The criterion is too vague or ambiguous to verify honestly |

For every criterion, capture:

- the verdict
- the evidence
- any assumptions, blockers, or follow-up questions

### Phase 3: Summarize readiness

Group the result into:

- **Ready** - criteria clearly met
- **Needs follow-up** - partial or not met
- **Needs clarification** - untestable or ambiguous

Report all three groups with their counts, gaps first, so the sign-off risk is visible before the good news.

### Phase 4: Recommend the next move

Depending on what the matrix shows:

- fix missing behavior
- clarify the criteria upstream
- add or adjust tests
- re-run verification after evidence improves

Use `./resources/ac-verification-template.md` when possible.

## Common Failure Modes

- verifying against a fuzzy paraphrase instead of the real acceptance criteria
- hiding ambiguity in prose instead of using an explicit status
- collapsing multiple criteria into one vague pass/fail judgment

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "The code is there, so it's Met" | Code present is not behavior observed. Met needs a run, a response, a screenshot, or a test that asserts the criterion. Code alone is at most Partial. |
| "It's basically done, the edge case is minor" | A criterion with a missing part is Partial. Record which part is missing; the sign-off owner decides whether it is minor. |
| "The criterion is vague, but it obviously means X" | Your reading is an invented requirement. Mark it Untestable, state the interpretations, and ask. |
| "The tests pass, so the criteria are met" | Passing tests prove what they assert. Map each criterion to the test that asserts it, or the criterion has no test evidence. |
| "I checked it on my branch" | The verdict holds for the environment it was observed in. State the build and environment, and re-verify where sign-off happens. |

## Red Flags

- A criterion marked Met whose evidence column is a file path with no observed behavior or test run.
- No Partial or Untestable verdicts on a criteria list with compound or vague wording.
- A criterion rewritten during normalization so that it now matches the implementation.
- A readiness summary that says "ready" while any criterion is Not Met or Untestable.
- No environment or build named for the evidence.

## Resource Map

- `./resources/ac-verification-template.md` - structure for the verification matrix and readiness summary

## Related Skills

- `analyzing-regression-scope` - when change impact needs tactical retest planning
- `designing-functional-tests` - when unmet criteria need new scenarios or manual cases
- `requirements-test-coverage-mapper` - when full traceability across test levels is required
- `reporting-bugs` - when a failed criterion should become a defect ticket

## Definition of Done

This skill is complete when:

- the matrix names the criteria source (ticket, story, or PRD section) and the build and environment the evidence came from
- every atomic criterion has a stable ID, and each compound original is shown with the IDs it was split into
- each criterion has one of the four statuses
- every Met or Partial verdict cites observed evidence (`file:line` plus a run, a response, a screenshot, or a named test); every Not Met states what was looked for
- every Untestable criterion states the ambiguity and the question asked
- the summary gives counts per group, gaps first, and a next move for each gap
