# Reproduction Recipes

Run each configuration with retries off, so a failure is reported as a failure. Keep the command and the summary line of the output; both go into the flake record.

## Playwright Test

```bash
# Nondeterminism inside the test: repeat it alone
npx playwright test tests/checkout.spec.ts -g "applies the discount" --repeat-each=50 --retries=0

# Parallelism: the same repeat with several workers, then with one
npx playwright test tests/checkout.spec.ts --repeat-each=20 --workers=4 --retries=0
npx playwright test tests/checkout.spec.ts --repeat-each=20 --workers=1 --retries=0

# Dependence on other tests: run the test alone, then its whole file
npx playwright test tests/checkout.spec.ts -g "applies the discount" --retries=0
npx playwright test tests/checkout.spec.ts --retries=0

# The grouping CI used: run the shard that failed
npx playwright test --shard=3/4 --retries=0

# CI-like conditions locally
CI=true npx playwright test tests/checkout.spec.ts --repeat-each=10 --retries=0

# A trace for every run, so the failing one can be opened
npx playwright test tests/checkout.spec.ts --repeat-each=20 --trace=on --retries=0
npx playwright show-trace test-results/<test-folder>/trace.zip
```

Notes:

- `fullyParallel: true` lets tests in one file run on different workers. If the flake disappears with `fullyParallel` off, the tests in that file share something.
- Playwright has no built-in random ordering. To probe order dependence, run the test alone, run the file, and run the neighbours that preceded it in the failing shard (`npx playwright test --shard=3/4 --list` shows which tests the shard holds).
- To match CI rendering and timing, run inside the same container image CI uses, pinned to the Playwright version in `package.json`:

```bash
docker run --rm -v "$(pwd):/work" -w /work -e CI=true \
  mcr.microsoft.com/playwright:v<same-version>-noble \
  npx playwright test tests/checkout.spec.ts --repeat-each=20 --retries=0
```

## Vitest

```bash
# Repeat: a shell loop is the portable way
for i in $(seq 1 50); do npx vitest run src/cart.test.ts --retry=0 || echo "FAIL on run $i"; done

# Order dependence: shuffle test order
npx vitest run --sequence.shuffle

# Parallelism: files in one worker vs many
npx vitest run --no-file-parallelism
```

Record the seed Vitest prints when shuffling, so a failing order can be replayed with `--sequence.seed=<seed>`.

## Jest

```bash
# Repeat
for i in $(seq 1 50); do npx jest src/cart.test.ts || echo "FAIL on run $i"; done

# Order dependence
npx jest --randomize

# Parallelism: all tests in one process, serially
npx jest --runInBand
```

`--randomize` prints the seed; replay it with `--seed=<seed>`.

## Reading the result

| Outcome | Next step |
| --- | --- |
| Fails alone under repeat | Timing, time, or randomness inside the test. Open the trace of a failing run. |
| Passes alone, fails in the file or a shard | Shared state or order dependence. Bisect the preceding tests. |
| Fails with N workers, passes with 1 | Data collision or a shared resource. Look for fixed accounts, ids, files, ports. |
| Fails only in the CI container or with `CI=true` | Environment. Diff config, env vars, timezone, locale, viewport, resources. |
| Fails only against the shared environment | External or shared-data dependency. |
| Will not reproduce anywhere | Add diagnostics and keep it on the list as `cause unknown`. |

## Diagnostics to add when it will not reproduce

- `trace: 'on-first-retry'` in CI, so the first failure of a retried test leaves a trace behind
- console and page-error logging to the test output (`page.on('console')`, `page.on('pageerror')`)
- failed-request logging (`page.on('requestfailed')`)
- the seed, the worker index, the shard, and the timestamp in the failure message
- the test's own generated ids, so a collision can be found in the backend logs

Remove noisy diagnostics once the cause is known; keep the trace setting.
