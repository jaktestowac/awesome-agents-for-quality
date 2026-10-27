# Artifacts and Retention

A failed CI job should be debuggable from its artifacts alone. Upload what answers "what happened", keep it as long as someone could still be asking, and nothing that leaks credentials.

## What to keep

| Artifact | Produced by | Upload when | Retention | Why |
| --- | --- | --- | --- | --- |
| Merged HTML report | `merge-reports --reporter=html`, or `html` reporter on unsharded runs | always (`!cancelled()`) | 14-30 days | the first thing anyone opens; links traces, screenshots, retries, and flaky markers |
| Traces | `trace: 'on-first-retry'` (or `retain-on-failure`) | on failure | 7-14 days | DOM snapshots, network, console, and timing per action; the main debugging tool for CI-only failures |
| Screenshots | `screenshot: 'only-on-failure'` | on failure | 7-14 days | quick look at the final state |
| Videos | `video: 'retain-on-failure'` | on failure | 7 days | useful for animation and focus problems; large, so keep retention short |
| Blob reports | `blob` reporter per shard | always | 1 day | input to the merge job only |
| JSON / JUnit results | `json` / `junit` reporters | always | 30-90 days, or pushed to a results store | machine-readable history for flake rate and duration trends |
| Visual diffs | `toHaveScreenshot` failures (expected, actual, diff) | on failure | 14 days | the reviewer needs the diff image, not a description |
| Performance summary | the load tool's summary export | always | keep history (90 days or a results store) | the next run compares against it |

Retention numbers are starting points. Match the longest one to how far back people investigate (a two-week sprint usually needs 14 days), and check the provider's storage quota before raising them.

## Trace settings by situation

| Situation | `trace` |
| --- | --- |
| Normal CI with retries on | `'on-first-retry'`: a trace for every test that failed once, no cost for passing tests |
| CI with retries off | `'retain-on-failure'`: records every test, keeps traces only for failures |
| Investigating a specific flake | `--trace=on` for that run only |
| Local development | off by default; `--trace=on` when needed |

## Never upload

- `.auth/` directories and any `storageState` JSON: they contain live cookies and tokens
- `.env` files or anything carrying secrets
- full database dumps or production-derived data (see `handling-sensitive-test-data`)
- `node_modules` or browser binaries as artifacts (that is what caches are for)

Traces and videos record what the page showed, including any real data a test against a shared environment displayed. Against environments with real personal data, shorten retention or turn videos off, and say so in the suite README.

## Make the artifacts findable

- link the merged report from the job summary or PR comment, not only from the artifacts list
- name artifacts with the job and shard (`playwright-report`, `test-results-3`), not `artifact`
- in the README, give the one command for opening a downloaded trace: `npx playwright show-trace path/to/trace.zip`, and for the report: `npx playwright show-report path/to/playwright-report`
