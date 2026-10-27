---
name: test-driven-development
description: 'Drives implementation test-first through red-green-refactor cycles, including multi-unit features built outside-in, legacy code without tests, and sessions that keep a written cycle log. Use when building a new behavior, when asked to fix a bug, or when changing what existing code does, and applies even when the code is pasted inline and the request does not mention tests. Also use whenever the request mentions TDD, test-first, red-green-refactor, or reproducing a bug with a failing test before fixing it, and when implementation keeps landing before anyone knows how it will be verified. For one small behavior or bug fix, test-driven-development-quick is enough; for tests added after the code exists, use writing-unit-tests.'
argument-hint: 'Behavior to build or bug to fix, the public interface it lives behind, and the existing test runner (if any)'
user-invocable: true
---

# Test-Driven Development

Use this skill when tests should drive the design instead of documenting it afterwards.
It keeps the work in small, verified steps: one failing test, one minimal implementation, one cleanup, repeat.

This skill is **framework-agnostic**. It does not assume a runner, an assertion library, or a mocking tool.
Detect what the project already uses before the first cycle; if nothing exists yet, ask which runner to target before writing a test.

## When to Use

Trigger phrases: "TDD", "test-driven", "test-first", "red-green-refactor", "write the test first", "start with a failing test", "make it fail, then make it pass", "reproduce it with a test before fixing".

Typical situations:

- build a new behavior test-first
- fix a bug by reproducing it with a failing test first
- add safety before refactoring untested code
- explore an unclear interface by writing the call you wish existed
- recover a codebase where implementation consistently outruns verification

Reach for this skill **before** writing production code, not after. If tests are being added to code that already exists, use `writing-unit-tests` instead.

## What TDD Is Here

TDD is a **design technique that produces tests as a by-product** - not a coverage technique. The loop's value is the pressure it puts on the interface: code that is hard to test first is usually code that is hard to use.

Judge a session by whether the design got clearer and every change was verified, not by the coverage number it produced.

### The seam

A **seam** is the public boundary the test observes behavior through - the interface a real caller would use. Tests live at seams, never against internals.

Every cycle starts by knowing which seam it drives. If you cannot name the seam, you are not ready to write the test.

**Seams are agreed, not assumed.** Name the seams you intend to test at and get them confirmed before the first test exists. Testing effort is finite; agreeing the seams up front is how it lands on the critical paths and the complex logic instead of on every edge case. Do not write a test at a seam nobody has confirmed.

### Choosing the loop shape

| Situation | Loop shape |
| --- | --- |
| A single unit's logic, interface already known | **Inner loop only** - unit-level red-green-refactor |
| A feature crossing several units | **Double loop** - one failing acceptance test held red on the outside, inner unit cycles until it goes green |
| The interface itself is the open question | Write the call you wish existed as the first test, and let it define the shape |
| Behavior depends on a real boundary (DB, HTTP, browser) | Drive the owned logic with unit cycles; verify the boundary separately in integration coverage |

In the double loop, the outer test stays red for several inner cycles. Say so explicitly, so a red suite is not mistaken for broken work.

**Drive the loop with the fastest test that can observe the behavior.** Red-green pays for itself only while the feedback is fast. A browser or end-to-end test as the cycle signal costs minutes per iteration, and looping on one for a feature that does not exist yet reliably ends in concluding the *test* is broken. Drive with the fastest thing that can observe the behavior; in a double loop the outer acceptance test is the cheapest test that proves the feature, not the heaviest. Browser coverage is written after the behavior works.

Before the first cycle, decide whether this change deserves the loop at all - `./resources/tdd-fit-check.md` has the decision table and what to verify with when the answer is no.

## Core Rules

- **Red before green** - no production code is written without a failing test demanding it.
- **Watch it fail for the right reason** - a test that fails on a typo, a missing import, or a setup error proves nothing. Read the failure message every time.
- **Evidence, not assertion** - actually run the tests at each step and quote the real output. Never claim a test is red or green without having seen it.
- **Minimal implementation** - write only enough code to pass the current test. No speculative branches, no features the next test has not asked for yet.
- **One slice at a time** - one behavior, one test, one implementation. Never write a batch of tests up front against imagined behavior.
- **Refactor only under green** - restructure with the suite passing, and run it again after. Behavior must not change during a refactor step.
- **Test at the public interface** - drive the unit through the seam a real caller would use, not through internals.
- **Assert against an independent source of truth** - the expected value comes from the spec, a worked example, a known-good literal, or the reported symptom. A value recomputed the way the implementation computes it passes by construction.
- **Reach green by changing the code, not the test** - if an existing assertion has to change, the specification changed. Say that out loud and get it confirmed. Loosening an assertion, deleting a stubborn test, or editing a test to match a wrong implementation ends the loop's value.
- **Match step size to confidence** - obvious behavior takes bigger steps; unfamiliar or fiddly behavior takes smaller ones. Repeated failure to reach green means the step was too big.
- **Commit at green** - each completed cycle is a safe point to commit. Order the commits so the sequence proves itself: the failing test lands before the code that satisfies it.

## Workflow

### Phase 0: Agree the interface and the seam

Before the first cycle, establish:

- the behavior being built, in the user's own vocabulary
- the public interface it will live behind
- the seam the tests will observe it through, confirmed rather than assumed
- the loop shape from the table above
- what is explicitly out of scope for this session

If the interface is genuinely unknown, that is fine: write the call you wish existed in the first test and let it define the shape. Do not silently invent requirements the user has not stated.

Then detect what the project already does, so the loop matches it instead of importing habits from elsewhere:

- where tests live and how test files are named
- the exact command to run **one** test file, and the command to run the **full suite**
- the runner's assertion and parameterized-test style
- helpers, factories, fixtures, and custom matchers already available
- project instruction files - `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, ADRs - and the domain vocabulary they establish, so test names and interface terms match it

The single-test command matters more than it looks: the loop only works while observing red and green is cheap. Do not introduce a new runner, library, or folder layout unless the user asks for it.

### Phase 1: Write the test list

List the behaviors to build, in order, smallest and most central first.
This is a queue, not a batch: it records what is coming, it does not authorize writing those tests yet.

Sequence the list so that each entry:

- adds one observable behavior
- can be made to pass in a few lines
- builds on what the previous cycle established

Start with the simplest case that is still interesting - usually a degenerate or empty input - then work outward to the general case.

Keep the list visible and update it as cycles reveal new cases. Use `./resources/tdd-cycle-log-template.md` when the session runs long enough to need a record.

### Phase 2: Run the cycle

Repeat for one entry at a time. `./resources/worked-example.md` shows several consecutive cycles in full.

#### Red

1. Write exactly one failing test for the next behavior.
2. Run it and read the actual output.
3. Confirm it fails, and that the failure message describes the **missing behavior** - not a syntax error, missing file, or broken fixture. If it fails for a mechanical reason, fix that first and run again; the mechanical failure does not count as red.
4. If it passes immediately, stop: either the behavior already exists, or the test asserts nothing meaningful. Fix the test before continuing.
5. Trace the expected value to its source: the spec, a worked example, a known-good literal, or the reported symptom. A value imported from the implementation's constants or recomputed with its formula fails this check.
6. Check the failure message would be understandable to someone who did not write the test. If not, improve the assertion now - this is the cheapest moment to do it.

#### Green

Get to green as fast as possible. Ugly is fine here; the refactor step is where it gets cleaned up.

Pick the strategy that fits your confidence:

| Strategy | Use when | What you write |
| --- | --- | --- |
| **Obvious implementation** | You know exactly how it works and it is small | The real implementation, directly |
| **Fake it** | You are unsure, or want the loop green quickly | A hardcoded constant that satisfies this test |
| **Triangulation** | A faked value needs generalizing | A second test with different data, which forces the real logic |

Then:

1. Run the **full suite**, not just the new test.
2. Confirm green with real output.
3. Leave cleanup for the refactor step.

Hardcoding is legitimate - the next test is what forces generalization. What is not legitimate is leaving a fake in place with no test on the list that will remove it.

**Doubles only at real boundaries.** Substitute what you do not own - the clock, randomness, the network, storage. If reaching green pushes you to mock a module you *do* own, the seam is in the wrong place: stop and say so rather than mocking your way to green. A test held up by stubs of your own code proves the stubs were called, freezes the current design, and breaks on the next refactor.

See `./resources/green-step-strategies.md` for how to choose between them and how to triangulate deliberately, and the test-doubles guide in `writing-unit-tests` for the double taxonomy and the boundary rule.

#### Refactor

With everything green, look for these in order, in both the production code and the tests:

1. **Duplication** - including duplication between the test's expected value and the implementation
2. **Naming** - do the names now match the vocabulary the tests revealed?
3. **Structure** - long functions, misplaced responsibility, a parameter list that keeps growing
4. **Test cleanliness** - extract a factory, collapse near-identical tests into a parameterized one

Rules:

- change structure only, never behavior
- one refactoring at a time, running the suite after each
- if a refactor turns the suite red, revert it rather than chasing the failure forward
- duplication is a signal, not a sin - wait until the third occurrence before extracting an abstraction

Refactoring is optional per cycle but not optional overall. Skipping it repeatedly is how a green suite ends up guarding a mess - and it is the step that quietly disappears first, because the next test is always more interesting than cleaning up the last one. At session close, state whether it happened. If it consistently does not, hand the cleanup to `code-review` as an explicit follow-up instead of leaving it implied.

Then take the next entry from the list.

### Phase 3: When you get stuck

If two or three attempts do not reach green:

1. **Stop adding code.** Revert to the last green commit rather than piling fixes onto a broken state.
2. **Take a smaller step.** Split the behavior; find a case that can pass in a couple of lines.
3. **Check the test, not just the code.** A test that is awkward to write is usually pointing at an interface problem - too many dependencies, hidden state, a boundary in the wrong place. Say that out loud; it is a design finding.
4. **Re-check the seam.** If the test needs heavy setup or many doubles, it is probably driving the wrong boundary.

If the session ends with the suite red, the closing report names the failing test and why it is still red.

### Phase 4: Fix bugs by reproducing them first

For a defect, the cycle starts with reproduction.

1. **Find the correct seam.** The right seam is one where the test exercises the real bug pattern as it occurs at the call site. A test at a seam too shallow to reproduce the actual conditions gives false confidence.
2. **Write a test that fails because of the bug**, and confirm the failure matches the reported symptom - not a different failure that happens to be nearby. Wrong symptom means wrong bug.
3. **Minimise the repro.** Cut inputs, setup, and steps one at a time, re-running after each cut, until every remaining element is load-bearing. The minimal case becomes the permanent regression test.
4. **Fix the code** until the test passes.
5. **Re-run the original, un-minimised scenario** to confirm the real-world symptom is gone.
6. **Keep the test permanently** - it is the regression guard.

Two conditions change the procedure:

- **The bug is intermittent.** Make the repro deterministic before fixing it - pin the clock, the seed, the ordering, the concurrency - and state which signal the test locks down. A flaky test cannot prove a fix; it can only fail to disprove one. The flaky-test triage resource in `writing-unit-tests` has the reproduction configurations and the symptom-to-cause table.
- **The bug exposes a class of failures.** Land the focused regression test first, then propose the sibling cases as separate cycles. Do not widen the repro into general coverage while the fix is still unproven.

Stage the commits so history reads red then green: the failing repro lands first, the fix on top. A reviewer can then replay the bug and its resolution instead of taking the fix on trust. Keep the regression test focused - no unrelated fixture churn riding along.

If no correct seam exists - the bug can only be reproduced through a path nothing can drive in a test - **that is itself the finding**. Say so, fix the bug, and flag the missing seam as a design problem rather than pretending a shallow test covers it.

Never fix first and test afterwards. A test written after the fix has never been seen catching the bug.

### Phase 5: Entering legacy code

To change code that has no tests, get a safety net before the loop starts:

1. Write characterization tests that pin what the code **currently** does, letting actual output define the expected values.
2. Raise anything that looks wrong as a question rather than fixing it in passing.
3. With the net in place, start normal red-green-refactor cycles for the new behavior.

See the legacy phase in `writing-unit-tests` for how to write those characterization tests.

### Phase 6: Know when the loop does not fit

TDD is not the right tool for everything. Step out and say so when:

- the behavior can only be proven across a real network, database, or browser - that is integration or end-to-end work
- the task is a pure rename or mechanical migration with no behavior change
- the design question is too open to express as an assertion yet - spike first, throw the spike away, then start the cycle properly
- the code is exploratory and genuinely disposable
- **there is no independent source of truth to assert against** - config, wiring, glue, straight delegation. The only assertion available restates the implementation, which is the tautology the loop exists to prevent, arrived at from the other direction.
- **the only available test would be a bad test** - one that mostly exercises its own mocks, needs expensive infrastructure for a small change, depends on production-only state, or would be deleted the moment it went green. Prefer no test to a bad test.

Say which of these applies instead of forcing a unit-shaped test onto the problem.

**Stepping out is not skipping verification.** Name the closest check you can actually execute - a targeted script, a manual reproduction command, a log or output comparison, an existing focused integration test, a type or startup check for wiring - run it before and after the change, and report its output in place of the red-green pair. Deciding a failing test is impractical is a legitimate call; reporting only the fix, with no substitute check named, is not.

`./resources/tdd-fit-check.md` holds the decision table, the bad-test definition, and the fallback checks.

### Phase 7: Close the session

Before declaring the work finished:

- run the full suite one final time and quote the result
- read the tests end to end - do they describe the feature to someone who has not seen the code?
- list any test-list entries left unbuilt, rather than dropping them silently
- name any fake implementation still in place and the test that should remove it
- state what the loop revealed about the design, including seams that turned out to be in the wrong place

Report the evidence, not just the outcome:

- the test that was **seen failing first**, and the failure output it produced
- the run that shows it passing, and the full-suite result
- any nearby validation run when the change carried wider risk - type check, lint, adjacent suites
- where red-green evidence could not be produced: why, which check replaced it, and what that check showed
- whether refactoring happened, or was deferred and to what

"It works and the tests pass" is not a report - it names no check that was ever seen failing.

## Common Failure Modes

- **Horizontal slicing** - writing all the tests first, then all the implementation. The tests then verify imagined behavior and lock in a shape nobody has validated.
- **Failing for the wrong reason** - the red step fails on a missing import or broken fixture, and the assertion is never actually exercised.
- **Over-implementing** - adding branches, options, and abstractions the current test never demanded.
- **Fake left behind** - a hardcoded value ships because no test on the list ever forced it to generalize.
- **Refactoring in the green step** - mixing behavior change with cleanup, so a failure has two possible causes.
- **Never refactoring** - always moving to the next test, so the design debt the loop was supposed to prevent accumulates anyway.
- **Step too big** - fighting for green across many attempts instead of reverting and splitting the behavior.
- **Testing internals** - driving private methods, which makes every later refactor break the suite.
- **Tautological assertion** - the expected value is recomputed the way the code computes it, or imported from the implementation's own constants, so the test passes by construction.
- **Cycling over glue** - running the loop on config, wiring, or straight delegation, where the only possible assertion restates the code.
- **Skipping the suite run** - running only the new test and discovering the regression several cycles later.
- **Testing at an unagreed seam** - picking a boundary nobody confirmed, so the effort lands somewhere that was never the risk.
- **Treating TDD as a coverage tool** - chasing a percentage rather than using the loop to shape the interface.

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "I'll write the code first and add the test right after" | A test written after the code has never been seen failing, so nothing shows it can catch the bug. Write the test, run it, quote the red, then write the code. |
| "I know it fails, no need to run it" | Unrun tests fail on imports and fixtures, or pass already. Run it and quote a failure message that names the missing behavior. |
| "The assertion was too strict anyway" | Loosening an assertion to reach green changes the specification. Fix the code; if the spec really changed, name the change and get it confirmed before editing the test. |
| "I'll mock this module so the test goes green" | A stub of code you own proves the stub was called and freezes the design. Move the test to a seam where only the clock, randomness, network, or storage is doubled. |
| "The end-to-end test is the real proof, so I'll loop on it" | A minutes-long cycle against a feature that does not exist yet ends in blaming the test. Drive with the fastest test that observes the behavior; add browser coverage once it works. |
| "This change is too small for a failing test" | Small changes are where red costs least. If there is truly no independent source of truth, step out per Phase 6 and run a named substitute check. |
| "I'll refactor at the end" | The end-of-session cleanup is the step that disappears first. Refactor under green each cycle, or record the deferral and its owner in the closing report. |

## Red Flags

- A production file is edited before the transcript shows any test failing.
- A new test passes on its first run and the next step starts anyway.
- The quoted "red" is a syntax error, missing module, or fixture failure, not an assertion.
- An expected value is imported from the module under test or computed with its formula.
- The change that turns the suite green also edits an existing expected value, adds a skip marker, or deletes a test.
- The diff mocks a module that lives in this repository.
- Green is claimed from the single new test, with no full-suite output.
- The fix and its regression test land together, with no earlier run or commit showing the test red on the bug.
- The closing report says "tests pass" without the command and its output.

## Resource Map

- `./resources/tdd-fit-check.md` - whether the change deserves the loop, what a bad test is, and which check to run when it does not
- `./resources/worked-example.md` - consecutive cycles in full, in neutral pseudocode
- `./resources/green-step-strategies.md` - fake it, obvious implementation, triangulation, step size, and the revert protocol
- `./resources/tdd-cycle-log-template.md` - test list plus per-cycle record of red, green, and refactor steps

## Related Skills

- `test-driven-development-quick` - the compact version, for routine single-behavior cycles that do not need the full workflow
- `writing-unit-tests` - the quality standard each test produced by the loop must meet, and the characterization-test procedure for legacy code
- `unslop-tests` - the audit for tests that already exist, including the ones the loop produced under time pressure
- `designing-test-data` - when the inputs and boundary values need deliberate design before the cycles start
- `designing-functional-tests` - when the behavior belongs in functional or end-to-end coverage instead
- `code-review` - for the deeper structural cleanup that does not belong inside the loop

## Definition of Done

This skill is complete when:

- the interface, seam, and loop shape are stated in the transcript and confirmed before the first test file exists
- the single-test and full-suite commands are the project's own, quoted as they were run
- the test list is visible, and each built entry has its own red run and green run
- every production change is preceded by quoted output of an assertion failure that names the missing behavior
- every expected value traces to the spec, a worked example, a literal, or the reported symptom
- the diff doubles only the clock, randomness, network, or storage, and every remaining fake has a listed test that will remove it
- the diff weakens, skips, or deletes no existing assertion; any spec change is named and was confirmed
- each refactor step is followed by a passing full-suite run, or the deferral is stated with its owner
- the final full-suite output is quoted with its pass count
- each bug fixed has a minimised regression test whose red run on the unfixed code is quoted or committed before the fix
- where the loop did not fit, the Phase 6 reason is named and the substitute check's before-and-after output is quoted
- the closing report lists design findings and every unbuilt test-list entry
