# CI-Only Failures

When a test is green locally and red in CI, consistently, the cause is in the difference between the two. List the differences, then remove them one at a time until the local run goes red too. A local red is the tight loop; diagnosing through repeated CI pushes is slow and noisy.

If CI is red only sometimes, it is flaky: use `stabilizing-flaky-tests`.

## The diff

Collect each value from both sides. Print them in a CI step if the logs do not already show them; never print secret values, only whether they are set.

| Area | Check | Typical symptom |
| --- | --- | --- |
| Runtime versions | Node, Python, Java, package manager; `npm ci` vs `npm install`; lockfile honoured | API missing, different dependency resolution |
| Browser versions | Playwright version in the lockfile vs the CI image tag; installed browsers | rendering or behaviour differences, "executable doesn't exist" |
| OS and filesystem | Linux vs Windows or macOS; case-sensitive paths; line endings; path separators | "module not found" for a file that exists with different casing; snapshot diffs on `\r\n` |
| Timezone | `TZ` (CI images usually run in UTC) | dates off by one, wrong hour, failures near midnight |
| Locale | `LANG`, `LC_ALL`, browser `locale` in config; ICU data in the runtime | decimal separators, currency, sorted order, translated labels |
| Headless and viewport | headed locally, headless in CI; viewport and device scale | element hidden behind a responsive layout, screenshot diffs |
| Fonts | fonts installed in the image | layout shifts, text overflow, visual diffs |
| Resources | CPU count, memory, worker count, shared runners | timeouts, out-of-memory kills (exit 137), slower startup |
| Secrets and env vars | required variables present; secrets unavailable to pull requests from forks; expired tokens | 401/403, "undefined" in a URL, login step fails |
| Network | egress rules, proxy, DNS, third-party rate limits, services not started | connection refused, timeouts to external hosts |
| Services and data | the app or database the job starts, its version, seed data, migrations | 404 on a record, schema errors |
| Job shape | sharding, parallelism, the tests that run before it on the same worker | passes alone, fails in the shard: check order dependence |
| Base URL and ports | `baseURL`, `webServer` config, port conflicts | navigation to the wrong host, server not ready |
| Clock | real time at run time vs when the test was written | date-relative data expired |

## Reproducing CI locally

- Run inside the same container image CI uses, with the same env vars (secret values supplied from your own environment, never pasted into the transcript).
- Set `CI=true`; many configs change retries, workers, reporters, and `forbidOnly` on it.
- Match `TZ` and locale explicitly: `TZ=UTC LANG=C.UTF-8 npx playwright test ...`.
- Match the worker count and shard, then narrow.

If the failure only appears on the CI runner, add diagnostics to the job instead of guessing: keep the trace on failure, print the environment diff above (secrets as set/unset), and upload logs as artifacts.

## Fix where the difference lives

- Pin the variable in config or the job: image tag, `TZ`, `locale`, `timezoneId`, viewport, versions, resources.
- Make the test independent of the variable when the variable is not what is being tested: freeze the clock, format expectations with the same locale as the app.
- If the app is genuinely wrong in the CI setting (for example, it breaks in UTC or on Linux), that is an application defect: report it.

Do not branch on `process.env.CI` inside a test to skip or relax an assertion.
