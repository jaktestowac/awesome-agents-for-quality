---
name: verifying-change-coverage
description: 'Verifies that the lines and branches a change actually touched are executed by tests, using LCOV or Cobertura diff coverage instead of whole-repo percentages, and escalates uncovered high-risk changes into a blocking finding. Use when a pull request needs a coverage gate that unrelated tests cannot satisfy, when total coverage looks healthy but the diff is untested, when wiring diff coverage into CI, or when someone claims a change is covered because the suite is green.'
argument-hint: 'Base ref, the coverage artifact path (LCOV/Cobertura) or the command that produces it, and the diff or PR under review'
user-invocable: true
---

# Verifying Change Coverage

Use this skill to answer one question honestly: **were the lines this change introduced actually executed by a test?**

Repo-wide coverage cannot answer it. A repo at 84% can merge an untested payment path and stay at 84%, because a big denominator absorbs a small numerator. Diff coverage changes the denominator to *the lines you just wrote*, which is the only denominator that maps to the risk you just added.

The distinction that runs through this skill: **configured is not verified.** A test runner in `package.json` proves the practice exists. Executed lines prove this change was tested. Report which of the two you measured.

## When to Use

- a PR gate needs a coverage signal that cannot be gamed by unrelated tests
- total coverage is stable but defects keep escaping in new code
- diff coverage has to be wired into CI for the first time
- a reviewer needs to know which specific new lines nothing executes
- an agent wrote tests and someone needs to know whether they exercise the new code
- coverage numbers are being quoted in a release decision and nobody knows what they measure

## Operating Principles

- **Executed lines, not configured tools.** The whole point. Say plainly which one you have.
- **No artifact, no verdict.** Without a coverage report you have static linkage - "a test file exists that imports this module" - which is weaker evidence and must be labelled as such. Never present it as coverage.
- **Branches matter more than lines on changed code.** New code is where new conditionals live. A line hit once with the `if` never taken is half-tested.
- **Uncovered is a question, not a verdict.** Some uncovered lines are fine: logging, type guards, unreachable defaults. The output is a list of uncovered changed lines with a judgement per group, not a percentage with a pass stamp.
- **Coverage proves execution, never correctness.** An assertion-free test covers everything and verifies nothing. Pair this with `unslop-tests` - a diff-coverage gate is exactly the pressure that produces coverage theatre.
- **Escalate by risk, not by count.** Three uncovered lines in auth outrank thirty in a formatter.
- **The gate belongs on changed lines only.** Demanding a repo-wide floor on a legacy codebase produces a permanently red gate that gets disabled within a month.

## Workflow

### Phase 0: Get the two inputs

**The changed lines.**

```bash
git diff <base>...HEAD --unified=0 -- '***.ts' '***.tsx'
```

`--unified=0` gives added-line ranges with no context, which is what you want to intersect against coverage. Keep the file → line-numbers map; discard removed lines, generated files, and anything the contract excludes.

**The coverage artifact.** Produce one if it does not exist:

```bash
npx vitest run --coverage --coverage.reporter=lcov   # → coverage/lcov.info
npx jest --coverage --coverageReporters=lcov
npx playwright test    # + c8/istanbul instrumentation for E2E coverage
```

See `./resources/coverage-artifacts.md` for the formats, the merge problem across suites, and the monorepo path pitfalls.

**If no artifact can be produced:** stop and say so. Report static linkage instead, labelled as static linkage, and state what it cannot tell you. Then make producing an artifact the first remediation item - this is the single highest-leverage change to a coverage story.

### Phase 1: Intersect

For each changed source file, intersect its added-line numbers with the executed lines in the report. Produce, per file:

- **changed lines** - added or modified executable lines (exclude blank lines, comments, pure type declarations, and `import` statements)
- **covered** - changed lines the report marks as executed at least once
- **uncovered** - changed lines with zero hits
- **partial branches** - changed lines with branch data where at least one path was never taken

Diff coverage = covered ÷ changed executable lines, per file and overall. Compute branch coverage on changed lines separately and report it as its own number beside the line figure.

The exclusions matter and are the most common source of a wrong figure - see `./resources/coverage-artifacts.md` for what counts as an executable line in TypeScript once it has been compiled or transformed.

### Phase 2: Classify each uncovered group

Group contiguous uncovered lines and give each group a class and a judgement:

| Class | What it is | Action |
| --- | --- | --- |
| **Untested logic** | branches, calculations, validation, error paths | write the test - this is the finding |
| **Untested integration** | code only reachable with a real dependency | integration test, or a documented exception |
| **Defensive** | `default:` on an exhaustive switch, `never` guards, invariant throws | acceptable; record why |
| **Instrumentation** | logging, metrics, tracing calls | acceptable |
| **Unreachable** | dead code | delete it rather than test it |
| **Hard to reach** | needs an exotic environment or a failure that cannot be simulated | exception with an owner and an expiry |

The first two are findings. The rest are exceptions and must be recorded, not silently subtracted - see `./resources/exceptions-and-thresholds.md`.

### Phase 3: Set the verdict

Combine diff coverage with the risk tags from `scoping-change-relevance`:

| Condition | Verdict |
| --- | --- |
| Changed lines below threshold **and** the file carries an escalation tag (`auth`, `critical-path`, `db-migration`, `new-endpoint`) | **BLOCK** |
| Changed lines below threshold on ordinary source | **WARN** |
| Threshold met but changed branches materially uncovered | **WARN** |
| Threshold met, uncovered lines all classified as acceptable exceptions | **OK** with the exceptions listed |
| No coverage artifact available | **INFO** - static linkage only, artifact required |

The escalation rule is the reason this beats a flat percentage: 70% on a logging module and 70% on session handling are not the same result, and one number cannot say so.

### Phase 4: Report

Report per file, worst first: changed lines, diff coverage, branch coverage on changed lines, and the uncovered groups with their class and a one-line judgement. Point at exact line ranges - `src/pricing.ts:142-149` - so the fix needs no hunting.

Finish with the two sentences that make the report honest:

1. What this measured: executed lines on the diff, from `<artifact>`, produced by `<which suites>`.
2. What it did not measure: whether the executing tests assert anything meaningful.

## Wiring It Into CI

`./resources/ci-wiring.md` has working GitHub Actions and GitLab CI jobs, the base-ref fetch depth that trips everyone up on the first attempt, artifact merging across suites, and the sticky-PR-comment pattern.

Three rules for the gate itself:

- Gate on **changed lines**, never on a repo-wide floor.
- Fail loudly or not at all. `|| true` on a coverage step is worse than no gate, because it reports green.
- Ship the gate as a warning for one iteration, then turn it blocking. A gate introduced blocking on a legacy repo gets removed; one introduced as a warning gets fixed.

## Common Failure Modes

- **Counting non-executable lines.** Imports, types, and interfaces inflate the denominator and hide real gaps.
- **One suite's artifact, many suites' tests.** Unit-only LCOV makes integration-covered code look uncovered. Merge, or say which suites the number represents.
- **Monorepo path mismatch.** Relative paths in the report that do not match the paths in the diff produce 0% coverage and a fake emergency.
- **Chasing the number.** A gate met by asserting nothing. This is the predictable failure of any coverage gate; read `unslop-tests` before celebrating.
- **Silent `/* istanbul ignore */`.** An exclusion with no reason and no owner is a waiver that skipped the register.
- **Treating uncovered as automatically bad.** Uncovered logging lines are fine. Reporting them as findings trains people to ignore the report.

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "Coverage is 85% overall, so this PR is fine" | The repo total absorbs an untested change without moving. Compute coverage on the changed executable lines and report that number. |
| "The suite is green, so the change is covered" | Green means the tests that ran passed, not that any of them executed the new lines. Intersect the diff with a coverage artifact. |
| "There's a test file for this module, that counts as covered" | That is static linkage. Label it as such, state what it cannot show, and make producing an artifact the first remediation item. |
| "I'll add `istanbul ignore` on the uncovered bit" | An unexplained exclusion is a waiver that skipped the register. Record it with a reason, an owner, and an expiry, or write the test. |
| "The gate passes now" after adding tests that assert nothing | Execution without assertions satisfies the gate and verifies nothing. Run `unslop-tests` on the tests that moved the number. |
| "The uncovered lines are just error handling" | Error paths are untested logic, the first class in Phase 2, and the paths most likely to fail in production. Classify them as findings. |

## Red Flags

- A coverage percentage in the report with no statement of whether it is repo-wide or diff-only.
- A verdict given with no coverage artifact path named.
- A changed file in `auth`, payments, or migrations reported as WARN or OK while below threshold.
- New `istanbul ignore`, `c8 ignore`, or exclude-pattern lines in the diff with no reason comment.
- `|| true` or `continue-on-error` on a coverage step.
- Uncovered lines listed with no class, or excluded from the count without being listed.
- New tests whose only assertions are truthy, defined, or "does not throw".

## Resource Map

- `./resources/coverage-artifacts.md` - LCOV and Cobertura formats, generating them per runner, merging across suites, what counts as an executable line, monorepo path pitfalls
- `./resources/exceptions-and-thresholds.md` - thresholds by profile, legitimate exception classes, how to record an exclusion with an owner and an expiry
- `./resources/ci-wiring.md` - GitHub Actions and GitLab CI jobs, base-ref fetching, artifact merge, sticky PR comment, warn-then-block rollout

## Related Skills

- `scoping-change-relevance` - supplies the risk tags that turn a below-threshold result into BLOCK rather than WARN
- `unslop-tests` - the necessary counterweight: coverage proves execution, this proves the tests assert something
- `writing-unit-tests` - when the finding is untested logic and tests have to be written
- `deriving-a-quality-contract` - where the diff-coverage threshold for this project is set
- `governing-quality-waivers` - when an uncovered area needs a recorded, dated exception
- `analyzing-quality-metrics` - for coverage's caveats as a metric and what to report alongside it

## Definition of Done

This skill is complete when:

- the report names the base ref, the diff command, the artifact path, and the suites that produced the artifact
- diff coverage is given per file and overall as covered ÷ changed executable lines, with both counts shown
- branch coverage on changed lines is reported as its own number
- every uncovered group is listed by line range (`file:start-end`) with its Phase 2 class and a one-line judgement
- the verdict cites the risk tag of each below-threshold file
- every exception has a reason, an owner, and an expiry in the report or the waiver register
- the report closes with what was measured and the statement that coverage does not prove the tests assert anything
