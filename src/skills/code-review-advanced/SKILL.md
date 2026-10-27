---
name: code-review-advanced
description: "Performs a thorough, evidence-driven code review of pull requests, legacy modules, and quality-critical changes, returning severity-ranked findings with evidence and a merge recommendation. Use when the user asks for a deep or thorough review, or when the change spans many files, refactors architecture, or touches auth, payments, persistence, CI, shared test fixtures, or hot paths, and needs analysis of correctness, maintainability, security, performance, test quality, and operability risks. For a fast sanity check of a small, low-risk diff, use code-review; for a test-code-only audit of tests that prove nothing, use unslop-tests."
argument-hint: "Repository context, changed files, review goal, and known risk areas"
user-invocable: true
---

# Advanced Code Review

Use this skill when a review needs to go beyond style feedback and surface the real engineering risks in a change.
It is built for complex pull requests, sensitive code paths, test automation suites, and refactors where a shallow review would miss important trade-offs.

## When to Use

Use this skill when the user asks for things like:

- "review this PR critically"
- "audit this change for maintainability or security"
- "look for architectural issues, not just syntax problems"
- "review this test automation code for flakiness and long-term cost"
- "analyze whether this refactor is safe to merge"

Typical scenarios:

- large or multi-file pull requests
- legacy code audits
- high-risk changes in authentication, payments, permissions, data flows, or CI pipelines
- changes that add tests but may still reduce confidence
- code that technically works but appears expensive to maintain

## Review Principles

- **Evidence over intuition** - every finding above Note points to a `file:line`, an observed behavior, or a named missing test
- **Risk over volume** - a few high-signal findings are better than a long list of cosmetic remarks
- **Context before judgment** - understand intent, constraints, and surrounding patterns before recommending change
- **Severity must mean something** - blockers and high-risk findings must be clearly separated from notes and polish
- **Actionable feedback only** - explain why the issue matters and what the safer direction looks like
- **Acknowledge uncertainty** - if the review lacks context, say so explicitly instead of pretending certainty

## Review Workflow

Follow the phases in order.

### Phase 0: Frame the review

Before reviewing, establish:

- scope: whole repository, changed files only, or one subsystem
- review goal: correctness, readiness, architecture, security, test quality, or debt discovery
- change type: feature, bug fix, refactor, migration, test-only, or infrastructure
- constraints: release pressure, backward compatibility, legacy boundaries, compliance needs

If the user does not provide this information, infer cautiously and list assumptions.

### Phase 1: Understand the context first

Read the code around the change before judging it. Check:

- surrounding modules and nearby patterns
- existing tests and how they express behavior
- documentation, ticket intent, or change summary if available
- whether the implementation matches the apparent architectural direction of the repository

If the request is based on a diff or pull request, identify:

- what behavior changed
- what behavior stayed implicit
- what could regress without detection

The phase is done when those three are written down; Phase 2 checks the diff against them.

### Phase 2: Inspect the change through multiple lenses

Use `./resources/review-checklist.md` as the primary checklist.

Always review at least these dimensions:

1. **Correctness** - logic, edge cases, state transitions, and error handling
2. **Maintainability** - readability, cohesion, duplication, coupling, and naming quality
3. **Architecture** - boundary violations, abstraction quality, hidden dependencies, and future change cost
4. **Security and privacy** - trust boundaries, secrets, authorization, unsafe defaults, and logging risks
5. **Performance and scalability** - obvious hot paths, unnecessary work, poor batching, blocking calls, or repeated setup
6. **Testing** - missing coverage, weak assertions, test realism, determinism, and regression detection strength
7. **Operability** - observability, diagnostics, fallback behavior, and failure recovery

When the reviewed code touches automated tests, also load `./resources/test-automation-review-lens.md`.

The phase is done when every dimension has either a finding or a line saying what was checked and found clean, and every changed file has been read in full or listed as sampled.

### Phase 3: Build findings with clear structure

Every finding above Note contains:

- **severity**: Blocker, High, Medium, Low, or Note
- **area**: correctness, architecture, test quality, security, performance, maintainability, or operability
- **summary**: short statement of the issue
- **evidence**: concrete file, behavior, or omission that supports the claim
- **risk**: why the issue matters
- **recommended direction**: the smallest safe improvement or follow-up

Assign severity by impact:

- **Blocker** - likely wrong, unsafe, or merge-blocking
- **High** - significant regression, security, data, or reliability risk
- **Medium** - important quality issue that should be addressed soon
- **Low** - valid improvement but not urgent
- **Note** - observation, trade-off, or follow-up idea with no immediate action required

### Phase 4: Write a review that is easy to act on

Use `./resources/review-report-template.md` for the response structure.

The review should usually include:

1. a short executive summary
2. the highest-risk findings first
3. specific strengths worth preserving
4. missing tests, docs, or operational safeguards
5. a final recommendation: `approve`, `comment`, or `request changes`

Keep feedback concrete and teammate-friendly.
Prefer "Consider extracting this dependency boundary because..." over vague criticism like "This feels messy."

### Phase 5: Self-check before finalizing

Before delivering the review, verify:

- the summary matches the actual findings
- duplicated comments are removed
- every non-trivial finding has evidence
- severity matches impact
- suggested fixes are proportionate to the problem
- the review distinguishes between immediate blockers and longer-term design advice

## Advanced Review Heuristics

### Signs a change is riskier than it first appears

- a refactor changes control flow and test snapshots still pass without stronger assertions
- the implementation introduces new branching but test coverage stays flat
- a helper reduces duplication but centralizes too many unrelated responsibilities
- the code hides I/O, retries, or state mutations behind innocent-looking abstractions
- logging or telemetry was changed in a way that weakens failure diagnosis
- the diff is small but touches a critical boundary such as auth, persistence, or test fixtures

### Good advanced review behavior

- distinguish merge-now issues from roadmap-quality concerns
- connect design comments to business or delivery risk
- keep suggestions incremental unless the current approach is structurally unsafe
- give test code the same design review as production code

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "The tests pass, so the logic is fine" | Passing tests prove only what they assert. Check whether any test exercises the changed branches; if none does, that is a Testing finding. |
| "It's a small diff, a skim is enough" | Small diffs to auth, persistence, or fixtures carry outsized risk. Read every changed line in a critical boundary, and say which files were sampled. |
| "I'll flag it as High to be safe" | Inflated severity buries the real blockers and trains the author to ignore the scale. Assign severity by the impact rule and state the impact. |
| "This is just bad practice" | A label with no consequence gives the author nothing to weigh. Name what breaks, for whom, and under what input. |
| "The author must have a reason, I'll let it go" | Unasked questions become unreviewed risk. Raise it as a Note or a question with the `file:line`. |
| "It needs a rewrite" | A rewrite recommendation on a mergeable change stalls it. Propose the smallest safe fix; reserve rewrites for structurally unsafe code and say why it is. |

## Red Flags

- A finding above Note with no `file:line` or observed behavior.
- More than half the findings are High or Blocker, or none are, on a change touching auth, payments, or data.
- The first finding listed is about naming, formatting, or style while a correctness or security finding sits lower.
- The executive summary's verdict contradicts the findings (for example `approve` with an open Blocker).
- No mention of tests on a diff that adds branches.
- "Looks good" with no list of what was read.

## Output Expectations

The preferred output is a structured markdown review using the template in `./resources/review-report-template.md`.

If the user asks for a shorter response, compress the output but preserve:

- high-level verdict
- severity-ranked findings
- evidence for important claims
- recommendation status

If the user asks for an example of the expected result, use `./resources/example-review.md`.

## Resource Map

- `./resources/review-checklist.md` - multi-lens checklist for advanced reviews
- `./resources/review-report-template.md` - reusable review output structure
- `./resources/example-review.md` - example filled review with severity-ranked findings
- `./resources/test-automation-review-lens.md` - extra review criteria for test suites and automation code

## Related Skills

- `code-review` - quick, lightweight review for small diffs and single files
- `unslop-tests` - the test lens: named tells in test code, severity-tiered, with Tier 1 findings proven by execution
- `tech-debt-analysis` - when review findings should feed a broader debt assessment
- `analyzing-regression-scope` - when the review should be paired with a retest scope analysis

## Definition of Done

This skill is complete when:

- the report states scope, goal, change type, and any assumptions made in place of missing context
- the report lists the files read in full and any sampled or skipped
- each of the seven Phase 2 dimensions has a finding or a "checked, clean" line
- every finding above Note has severity, a `file:line` or observed behavior as evidence, the risk, and a recommended direction
- findings are ordered by severity, and specific strengths worth preserving are named
- missing tests, docs, or operational safeguards are listed by what they would protect
- the final recommendation (`approve`, `comment`, or `request changes`) is consistent with the highest open severity

