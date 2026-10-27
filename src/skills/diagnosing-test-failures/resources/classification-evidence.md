# Classification Evidence

Assign one primary class per failure. Cite the evidence that put it there. When two classes fit, run the separating check in the second table before choosing.

## Signatures

### Application defect

- the test's actions in the trace are correct and complete, and the app's response is wrong: wrong status, wrong body, wrong rendered value, missing element
- a console error, uncaught exception, or 5xx in the trace or server log at the moment of failure
- the same symptom reproduces by hand or with a direct HTTP call, outside the test
- `git log` on the code under test shows a change since the last green run; `git bisect run` lands on an app commit
- the test's expectation matches a written requirement, acceptance criterion, or API contract

### Test bug

- the locator no longer matches: "strict mode violation", "element not found", or it matches a different element after a markup change
- the expected value is outdated after an intended product change, and the change is documented (ticket, PR, release note)
- a missing `await`, a promise asserted before it settles, a one-shot read compared later (`expect(await el.textContent()).toBe(...)` instead of a web-first assertion)
- setup that does not create what the test assumes, or teardown that removes something a later step needs
- `git bisect run` lands on a test-only commit

### Environment / config

- fails in one place only: CI, one OS, one browser project, one container image
- started after a dependency, browser, runtime, or image upgrade with no app or test change
- the error mentions a missing env var, a refused connection, a wrong base URL, a certificate, or an out-of-memory kill
- date, number, or currency formatting differs from the expected value (timezone or locale)
- see `./ci-only-failures.md` for the diff to run

### Flaky

- a pass and a fail on the same commit with the same command
- passes on retry in CI (the report labels it flaky)
- the error message differs between failing runs

Hand over to `stabilizing-flaky-tests` with the Phase 1 runs. Do not keep diagnosing it here.

### Test data

- "already exists", duplicate key, "not found" for a record the test did not create
- passes against a freshly seeded database, fails against a shared environment
- depends on a date-relative record that has expired (a trial that ended, a booking now in the past)
- fails after another team or a scheduled job changed shared data

## Separating neighbours

| Unsure between | Run this | Reading |
| --- | --- | --- |
| App defect vs test bug | Reproduce the symptom outside the test (by hand, or a direct API call). Check the expectation against the requirement. | Symptom outside the test and the expectation matches the requirement: app defect. Behaviour matches the requirement and the test disagrees: test bug. |
| App defect vs test bug, after a product change | Find the change. Was the new behaviour intended and documented? | Intended and documented: update the test and cite it. Not documented: ask the owner; do not assume. |
| Test bug vs flaky | Repeat the test alone 20 times, retries off. | Fails every time: test bug (or app defect). Mixed: flaky. |
| Environment vs app defect | Run the same commit locally in the CI image with CI env vars. | Red in the image, green outside it: environment. Red in both: keep looking at the app. |
| Test data vs test bug | Run against freshly seeded data, or with the data the test creates itself. | Green on fresh data: test data. Still red: test bug or app defect. |
| Environment vs flaky | Repeat in CI conditions. | Fails every time in CI: environment. Mixed in CI: flaky. |

## For a reported defect (no failing test yet)

Collect before building the loop:

- the exact observed behaviour and the expected behaviour, and the source of the expectation
- the environment, build or version, browser, account role, and data involved
- steps as reported, with anything ambiguous marked
- artifacts: screenshot, recording, console output, HAR, server log (redacted)

The first loop is then a failing test that reproduces the reported symptom at the narrowest seam that reaches it. If it cannot be reproduced, record what was tried and the conditions that differ from the report, and ask the reporter for the missing piece.
