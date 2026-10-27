# Suite Layering

How to decide what runs on which trigger, and how to select it.

## Worked trigger matrix (illustrative)

A web app with ~600 unit tests, ~120 API tests, ~180 Playwright E2E tests, a visual suite of 40 snapshots, and a k6 regression check.

| Job | Trigger | Selection | Shards | Blocking | Budget |
| --- | --- | --- | --- | --- | --- |
| unit + component | PR, main | all | 1 | yes | 3 min |
| api | PR, main | all | 1 | yes | 4 min |
| e2e-smoke | PR | `--grep @smoke --project=chromium` (~25 tests) | 1 | yes | 6 min |
| e2e-affected | PR, when `src/checkout/**` changes | `tests/e2e/checkout` | 1 | yes | 6 min |
| e2e-full | merge to main | `--project=chromium --grep-invert "@slow\|@quarantine"` | 4 | yes on main | 15 min |
| e2e-matrix | nightly | all projects, includes `@slow` | 4 per project | no, reported | 60 min |
| quarantine | nightly | `--grep @quarantine` | 1 | no, reported | 10 min |
| visual | PR when UI paths change, nightly | `--grep @visual` in pinned container | 1 | yes on PR | 8 min |
| perf-regression | release candidate, nightly | k6 smoke-load script | 1 | per release policy | 10 min |

Whether a job is "blocking" is a decision for `generating-quality-gate-workflows`; this table records the intent.

## Selection mechanisms

Prefer one mechanism per axis, so the selection is predictable.

| Axis | Mechanism (Playwright) | Example |
| --- | --- | --- |
| Importance / speed | tags | `test('...', { tag: '@smoke' }, ...)`; `--grep @smoke`, `--grep-invert @slow` |
| Browser / device / role | projects | `--project=chromium`; nightly runs all |
| Area of the product | folders | `npx playwright test tests/e2e/checkout` |
| What changed | CI path filters | GitHub `on.pull_request.paths`, GitLab `rules: changes:` |
| Previously failed | `--last-failed` | local reruns after a red CI run, not as a CI selection |

Tag meanings live in the tag glossary (`documenting-test-suites`). Count what each filter selects with `--list` and record the number; a `--grep-invert` chain that quietly excludes a third of the suite is a common finding.

```bash
npx playwright test --list --grep @smoke | tail -1
npx playwright test --list --grep-invert "@slow|@quarantine" | tail -1
```

## Smoke selection rules

- 15-30 tests that cover the journeys whose breakage would stop users: sign-in, the primary purchase or create flow, navigation shell, one critical read path
- each smoke test is independent and runs in under a minute
- smoke is a subset of the full suite, not a separate set of tests that drifts
- review the smoke list when a production incident escapes it

## Running old and new suites during a migration

While a suite moves (for example, Cypress to Playwright), both run. Keep the overlap short and visible.

- **Separate jobs, separate reports.** `e2e-legacy` and `e2e-playwright`, each with its own artifacts. Do not merge their reports; their test identities differ.
- **Same triggers for the same coverage.** If the legacy checkout tests ran on PR, the ported checkout tests run on PR from the day they land.
- **Shrink the legacy job slice by slice.** When a slice passes its parity gate, delete its legacy tests in the same or next PR; the legacy job's selection shrinks with it. A legacy job whose selection never shrinks is a stalled migration.
- **Track both in the job summary.** Test count and duration per job, per week. The legacy count must go down.
- **Remove the legacy job, its cache keys, its browser install, and its secrets when the last slice lands.**

The parity gate itself and the slice plan belong to `migrating-tests-to-playwright`.
