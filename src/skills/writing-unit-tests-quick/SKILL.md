---
name: writing-unit-tests-quick
description: 'Writes a few solid unit tests with a compact set of rules for structure, assertions, determinism, and edge cases. Use for a few routine tests on one function, class, or small module, or a quick sanity check on tests someone just wrote. For legacy code, test-double design, or a full suite review, use writing-unit-tests.'
argument-hint: 'The function or module to test, and the test runner already used in the project'
user-invocable: true
---

# Quick Unit Tests

A compact standard for everyday unit testing: enough to keep tests honest, short enough to read in one pass.

Framework-agnostic - match whatever runner, assertion style, and file layout the project already uses. If none exists, ask which runner to target before writing anything.

## When to Use

1. Add tests for one function, class, or small module.
2. Sanity-check a handful of tests someone just wrote.
3. Cover a bug fix or a small new branch.

Escalate to `writing-unit-tests` when the job is a legacy backfill, a flaky or slow suite, a full-suite review, or heavy test-double design. Use `test-driven-development` when the tests should come before the code.

## The Rules

1. **Test behavior, not implementation.** Assert what the public interface returns, throws, or emits. Never touch private state.
2. **One reason to fail.** If the test name needs "and", split it.
3. **Name the behavior and the condition.** `returns zero when the cart is empty` - the CI log alone should say what broke.
4. **Arrange - Act - Assert**, visibly separated, with exactly one call to the unit under test.
5. **Expected values are independent literals.** Never recompute them the way the code does, and never import the implementation's own constant - that test can only agree with the code.
6. **Assert specific values.** Not truthy, not defined. For errors, assert the type and the meaningful part of the message.
7. **No logic in the test.** No loops or conditionals - use the runner's parameterized/table-driven API so each case reports separately.
8. **Control nondeterminism.** Inject or freeze time, randomness, and IDs; use fake timers instead of real delays; await every promise and assert rejections directly.
9. **Mock only what you do not own.** Network, storage, clock. Never stub your own modules - that freezes the design and breaks on every refactor.
10. **No real I/O.** If proving the behavior needs a database, HTTP call, or browser, say so and route it to integration coverage instead of mocking around it.
11. **Synthetic test data only.** No credentials, tokens, or real personal data - a fixture committed once stays in history forever.
12. **Leave nothing skipped silently.** A `skip` or `only` carries an issue link and an owner, or it does not land.
13. **Raise testability problems as findings.** Hard-to-test code is a design finding to raise, not something to restructure inside a test-adding change.

## Cases to Cover

For each unit, walk this list and keep what applies:

- **happy path** - typical input
- **input classes** - one representative per meaningfully different group
- **boundaries** - empty, zero, one, min, max, off-by-one, just outside the range
- **invalid input** - wrong type, malformed value, missing required field
- **error paths** - thrown errors, rejected promises, failure return values
- **state or sequence** - behavior that depends on what happened before

Skip trivial getters, framework wiring, and third-party library behavior. A test with nothing to prove still breaks on refactors.

## Before You Finish

Two checks, both quick, and both **run rather than imagined**:

- **Mutation check** - break the covered behavior on purpose, run the test, see it fail, restore the code, see it pass. A test written after the code has never been seen failing; this is the only thing that proves it can.
- **Refactor check** - rename internals and restructure without changing behavior. Does the test still pass? If not, it is coupled to implementation.

Then run the full suite, not just the new tests, and quote the real result.

If a test fails intermittently, reproduce it first - repeat runs, isolation, random order, parallel on and off - then fix the cause rather than adding a retry or a longer timeout. `writing-unit-tests` carries the triage procedure.

## Common Failure Modes

- expected value recomputed the same way the implementation computes it
- one test asserting five unrelated things, so a failure says nothing
- `toBeTruthy()` where a real value belongs
- a `try/catch` around the act step that passes when nothing throws
- real clock, real `sleep`, or real network inside a unit test
- every collaborator stubbed, so the test only proves the stubs were called
- real credentials or personal data in a fixture
- tests added to move a coverage number

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "The test fails, so I'll set the expected value to what the code returns" | That freezes the bug into the spec. Confirm the output against the spec; if they disagree, report the defect. |
| "I'm sure it would catch a regression" | Not until seen red. Run the mutation check and quote the failure. |
| "A retry is fine for now" or "I'll skip it and file a ticket" | Both hide the defect. Reproduce and fix the cause; a skip lands only with an issue link and an owner. |

More excuses and their answers: the Common Rationalizations table in `writing-unit-tests`.

## Red Flags

- An expected value equals the observed output with no cited source.
- The only assertion is truthy, defined, or "does not throw".
- `skip`, `only`, an added retry, or a raised timeout in the diff.
- "All green" with no command, counts, or quoted mutation-check failure.

## Related Skills

- `writing-unit-tests` - the full standard: legacy backfills, flaky suites, test-double design, suite review
- `unslop-tests` - the named-tell audit for tests that already exist
- `test-driven-development-quick` - when the tests should drive the implementation, in the same compact form
- `test-driven-development` - the full loop, for multi-unit features and legacy code
- `designing-test-data` - when the inputs and boundary values need deliberate design first

## Definition of Done

- every test has one reason to fail and a visible Arrange - Act - Assert shape
- every expected value is a literal traced to the spec, an example, or a known-good result
- the diff contains no real clock, unseeded randomness, real I/O, or state shared between tests
- at least one boundary test and one error-path test exist per unit, or the report says why none apply
- fixtures are synthetic, and every skip carries an issue link
- the mutation check's red output is quoted, the refactor check was run, and the full-suite command and counts are quoted
