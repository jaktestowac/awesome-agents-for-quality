# Feedback Loops

Commands for building a tight loop around one failure. Substitute the project's own scripts when they wrap the runner (`npm test`, `pnpm test:e2e`). Always run with retries off while diagnosing, so a retry cannot turn a red into a green you do not see.

## Playwright Test

```bash
# Narrow to the one failing test, retries off, one worker
npx playwright test tests/checkout.spec.ts --grep "applies the discount" --retries=0 --workers=1

# Only the tests that failed in the last run
npx playwright test --last-failed --retries=0

# One browser project, when only one fails
npx playwright test --project=webkit --grep "applies the discount" --retries=0

# Record a trace for every run, then open it
npx playwright test tests/checkout.spec.ts --grep "applies the discount" --trace on --retries=0
npx playwright show-trace test-results/<test-folder>/trace.zip

# Step through with the inspector (headed, one worker, no timeout)
npx playwright test tests/checkout.spec.ts --grep "applies the discount" --debug

# Watch it run
npx playwright test tests/checkout.spec.ts --grep "applies the discount" --headed

# Check it is not intermittent before treating it as consistent
npx playwright test tests/checkout.spec.ts --grep "applies the discount" --repeat-each=20 --retries=0

# Verbose browser-API logging
DEBUG=pw:api npx playwright test tests/checkout.spec.ts --grep "applies the discount"
```

Screenshots and video are set in config, not on the command line:

```ts
// playwright.config.ts
use: {
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

What to read in a trace:

- the **Actions** list: the step that failed and the one before it. A correct action against wrong page state points at the app or at timing; a wrong action points at the test.
- the **before / after DOM snapshots** of the failing step: was the element there, visible, enabled, with the expected text?
- the **Network** tab: the request the step depended on, its status, and its body. A 4xx or 5xx here is usually the answer.
- the **Console** tab: uncaught errors in the app.

Traces store request headers, cookies, and storage state. Quote individual lines and redact; do not paste or attach a trace from a real account without checking it.

`await page.pause()` inside a test stops at that line in headed mode, for an interactive look at state.

## Vitest

```bash
npx vitest run src/cart.test.ts -t "applies the discount" --reporter=verbose --retry=0
# Debugger: attach to the paused process, one file at a time
npx vitest run src/cart.test.ts -t "applies the discount" --inspect-brk --no-file-parallelism
```

## Jest

```bash
npx jest src/cart.test.ts -t "applies the discount" --runInBand --verbose
# Debugger
node --inspect-brk node_modules/.bin/jest src/cart.test.ts -t "applies the discount" --runInBand
```

## pytest

```bash
pytest tests/test_cart.py -k "applies_discount" -vv -x
pytest --lf -vv          # only the last failures
pytest tests/test_cart.py -k "applies_discount" --pdb    # drop into the debugger on failure
```

## Known-failure markers

Use these to keep an application defect visible with the assertion unchanged. Put the bug link in the reason.

| Runner | Expected to fail (flags when the bug is fixed) | Do not run |
| --- | --- | --- |
| Playwright | `test.fail(true, 'BUG-123')` or `test.fail('title', ...)` | `test.fixme(...)` |
| Vitest | `it.fails('...', ...)` | `it.todo` / `it.skip` with the link |
| Jest | `test.failing('...', ...)` | `test.skip` with the link |
| pytest | `@pytest.mark.xfail(strict=True, reason="BUG-123")` | `@pytest.mark.skip(reason="BUG-123")` |
| JUnit 5 | none built in | `@Disabled("BUG-123")` |

Prefer the expected-to-fail form: it runs the test and turns red when someone fixes the bug, so the marker cannot outlive the defect.

## Bisect

When a test was green at one commit and red at another:

```bash
git bisect start
git bisect bad HEAD
git bisect good <last-green-sha>
git bisect run npx playwright test tests/checkout.spec.ts --grep "applies the discount" --retries=0 --workers=1
git bisect reset
```

The command must exit 0 on green and non-zero on red. If the test itself changed in the range, bisect with a copy of the current test file kept outside the repo, so every commit is judged by the same question.

## Differential loop

Run the same input against two states and diff the outputs: two app versions, two configs, CI image vs local, two browser projects. Useful when nothing errors but a value differs.

## Prove the test can still fail

After fixing a test bug, check the fixed test is not now passing for any input:

1. Break the behaviour it covers on purpose: change the expected rule in the app code, return a wrong value from a stub, or remove the element.
2. Run the test. It must go red with a message that names the broken behaviour.
3. Revert the deliberate break and `git diff` to confirm the revert is complete.

A fixed test that stays green in step 2 has lost its assertion; fix it again.

## When a human must act

If a step needs a person (a hardware token, a manual approval), write the remaining steps as a short numbered script the user follows, and ask them to paste back the observed result in a fixed form (`RESULT=red|green`, `MESSAGE=...`). The loop stays structured even when it is not automated. Never ask for the credential itself.
