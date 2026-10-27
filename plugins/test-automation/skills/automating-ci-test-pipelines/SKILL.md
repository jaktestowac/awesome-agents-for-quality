---
name: automating-ci-test-pipelines
description: 'Builds and tunes the CI jobs (GitHub Actions, GitLab CI, or similar) that run automated test suites: which suite runs on which trigger (PR smoke, full on merge, nightly matrix), sharding with merged reports, dependency and browser caching, trace and report artifacts with retention, a CI-only retry policy whose flakes are reported, running old and new suites side by side during a migration, separate performance and visual jobs, and a runtime budget that keeps feedback fast. Use when adding a test suite to CI, when the pipeline is too slow, when a failure in CI cannot be debugged because no trace or report was kept, when shards produce separate reports, or when suites need splitting by trigger. For merge-blocking gates, use generating-quality-gate-workflows.'
argument-hint: 'The suites and runners, the CI provider, current pipeline duration and pain points, and the triggers available (PR, merge, schedule, release)'
user-invocable: true
---

# Automating CI Test Pipelines

Use this skill to make test suites run in CI quickly, predictably, and in a way that leaves enough behind to debug a failure without rerunning it.

Two pipelines are common and both fail their users. One runs the whole end-to-end suite on every push, takes forty minutes, and gets bypassed. The other is fast because it keeps nothing: a red job with no trace, no report, and a log that ends at "1 failed". The target is a pipeline where the fast job answers "did I break the obvious things" in minutes, the full job answers "is main healthy" before the next merge, and every failure ships its own evidence.

## Boundary with generating-quality-gate-workflows

- **This skill**: how tests *run* in CI. Trigger layering, sharding, caching, artifacts, retries reporting, overlapping suites during migration, performance and visual job setup, runtime.
- **`generating-quality-gate-workflows`**: what *blocks*. The quality contract, severity policy, required checks, soft gates, diff coverage, sticky PR comments, waivers.

When both are in play, design the jobs here and hand the list of jobs to the gate skill to decide which become required checks. A job built here is not a gate until branch protection says so.

## When NOT to Use

- the tests themselves are flaky: fix them with `stabilizing-flaky-tests`; CI retries only contain the damage
- the question is which tests to run for this specific change: `analyzing-regression-scope` and `scoping-change-relevance` produce the selection; this skill runs it

## Operating Principles

- **Layer by trigger and feedback time.** The PR job is small and fast; the merge job is complete; the nightly job is broad. Each layer has a time budget.
- **Every failure carries its evidence.** Trace, HTML report, screenshots, and the merged report are uploaded on failure, with a retention period chosen on purpose.
- **Retries are CI-only and reported.** `retries: process.env.CI ? 2 : 0`. A test that passes on retry is a flake; it shows up in the report and in the flake list, never silently as a pass.
- **Shard to cut wall-clock, merge to keep one report.** Sharded runs that produce N separate reports are N places nobody looks.
- **Cache inputs, never results.** Dependencies and, where it pays, browsers. Test results and snapshots are never restored from cache.
- **Measure before tuning.** Know where the minutes go (install, build, server start, tests, upload) before adding shards.

## Workflow

### Phase 0: Inventory

Record, per suite: runner, test count, local and CI duration, how it is started (dev server, built app, deployed environment), what it needs (database, seeded data, secrets), and current flake rate if known. Record the CI provider, available runner sizes, and the triggers in use. Note the current end-to-end time from push to result for a typical PR.

### Phase 1: Assign suites to triggers

Default layering; adjust to the inventory. `./resources/suite-layering.md` has the selection mechanics (tags, projects, path filters) and a worked matrix.

| Trigger | What runs | Budget |
| --- | --- | --- |
| Pull request | lint, typecheck, unit, component, API; E2E `@smoke` on one browser; E2E for touched areas when path filters exist | under 10 minutes |
| Merge to main | full E2E on the primary browser, sharded; contract tests | under 20 minutes |
| Nightly / scheduled | cross-browser and device projects, `@slow`, long data-heavy flows, quarantined tests (non-blocking) | as needed, results by morning |
| Release candidate | smoke against the deployed environment, performance regression check, visual suite if not on PR | agreed with release owner |

Rules: a suite that never runs on any trigger is dead; a suite on every trigger is the slow pipeline. If the PR job cannot fit its budget, shrink its selection before adding hardware.

### Phase 2: Make the runner config CI-aware

In Playwright, put CI behaviour in config, not in workflow flags scattered across files:

```typescript
export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  reporter: process.env.CI ? [['blob'], ['github']] : [['html', { open: 'on-failure' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

`forbidOnly` stops a stray `test.only` from turning CI green on one test. `trace: 'on-first-retry'` makes every flake leave a trace behind. Tune `workers` to the runner size, not to the laptop.

### Phase 3: Shard and merge

Shard when one machine at full workers exceeds the layer's budget. Each shard writes a blob report; a merge job downloads them all and produces one HTML report (and JUnit or JSON if other tools consume it). The merge job runs even when shards fail (`if: ${{ !cancelled() }}` in GitHub Actions), and the matrix uses `fail-fast: false` so one red shard does not cancel the evidence from the others.

`./resources/provider-recipes.md` has the full GitHub Actions and GitLab CI jobs. Shard count: start at 2-4, never more than there are test files (with `fullyParallel: false`), and stop adding shards when per-shard setup time dominates.

### Phase 4: Cache and set up once

- dependencies: the provider's package-manager cache keyed on the lockfile
- browsers: either cache `~/.cache/ms-playwright` keyed on the Playwright version (and still run `npx playwright install-deps` on a hit, since OS packages are not in that cache), or run in the official Playwright container image pinned to the same version. Measure both; a cache restore is not always faster than a download.
- build the app once per pipeline and pass it to test jobs as an artifact, instead of building in every shard
- cancel superseded runs on the same branch (a concurrency group) so a new push does not queue behind the old one

### Phase 5: Keep the evidence

`./resources/artifacts-and-retention.md` has the per-artifact table. The minimum:

- merged HTML report, always uploaded (`!cancelled()`), retention 14-30 days
- traces, screenshots, and videos from `test-results/`, uploaded on failure, retention 7-14 days
- blob reports, retention 1 day; they exist only to be merged
- JUnit or JSON output where a dashboard or flake tracker reads it

Never upload `.auth/` or any `storageState` file; it holds live session tokens.

### Phase 6: Report retries as flakes

With CI retries on, a test can fail, pass on retry, and the job goes green. Make that visible:

- the HTML and merged reports mark such tests as `flaky`; link the report from the job summary
- export the JSON or JUnit result and feed flaky counts into the flake list (`analyzing-quality-metrics` defines flake rate; `tracking-quality-trends` keeps the series)
- keep retries at 2 or fewer; a project or test with a higher override is a finding for `stabilizing-flaky-tests`

### Phase 7: Special jobs

- **Visual regression**: run in the same pinned container that generated the baselines; upload expected, actual, and diff images on failure. Baseline policy is owned by `running-visual-regression-tests`.
- **Performance**: a separate job on a dedicated or consistent runner, not alongside sharded E2E on shared runners; store each run's summary as an artifact so the next run can compare. Thresholds and workload come from `testing-performance-and-load`.
- **Migration overlap**: run the old and new suites as separate jobs with separate reports while slices move; delete the old job's coverage slice by slice. See `./resources/suite-layering.md` for the overlap pattern and `migrating-tests-to-playwright` for the parity gate.
- **Against deployed environments**: no `webServer`; `BASE_URL` from the environment's variables; secrets from the CI secret store, scoped to that job.

### Phase 8: Hold the budget

`./resources/pipeline-speed-budget.md` lists where time goes and the levers in order of cost. After every change, record PR and main durations. A pipeline gets slow one reasonable addition at a time; the budget is what notices.

### Phase 9: Verify

Before calling it done:

- push a branch with one deliberately failing test: the job goes red, the merged report shows the failure, and the trace opens from the downloaded artifact
- push a branch with one flaky test (fails on first attempt only): the job passes, the report shows it as flaky, and the flake count is exported
- confirm the PR job meets its budget on three consecutive runs
- confirm the `test.only` guard fails CI

## Common Failure Modes

- the full E2E suite on every PR push, so people stop waiting for it
- shards each uploading their own HTML report, never merged
- `fail-fast: true` on the shard matrix, discarding the evidence from other shards
- traces off in CI, or uploaded only on success
- retries set to 3-5 "for stability" with no flaky count reported anywhere
- browsers installed in every shard while the app is rebuilt in every shard too
- the old suite's job left running after migration "for safety", unowned
- performance checks on noisy shared runners, so the trend is runner noise
- `storageState` files uploaded as artifacts

## Resource Map

- `./resources/suite-layering.md` - trigger matrix, selection by tags, projects and paths, and running old and new suites during a migration
- `./resources/provider-recipes.md` - GitHub Actions and GitLab CI jobs for sharded Playwright with merged reports, caching, and artifacts
- `./resources/artifacts-and-retention.md` - what to upload, when, for how long, and what never to upload
- `./resources/pipeline-speed-budget.md` - where pipeline time goes and the levers in order of cost

## Related Skills

- `generating-quality-gate-workflows` - which of these jobs block, the severity policy, and soft gates
- `stabilizing-flaky-tests` - for the tests the retry report identifies
- `designing-test-automation-architecture` - tags, projects, and suite layers that the trigger matrix selects on
- `running-visual-regression-tests` - baseline containers and the visual review workflow
- `testing-performance-and-load` - the performance regression check this pipeline runs
- `migrating-tests-to-playwright` - parity gates for the slices moving between the old and new jobs
- `analyzing-quality-metrics` - suite duration, queue time, and flake rate definitions
- `scoping-change-relevance` - path filters for expensive jobs

## Definition of Done

This skill is complete when:

- each suite is assigned to at least one trigger, and each trigger has a written time budget
- CI behaviour lives in runner config: CI-only retries of 2 or fewer, `forbidOnly`, trace on first retry, blob or equivalent reporter for shards
- sharded runs produce one merged report, the merge runs when shards fail, and the matrix does not fail fast
- dependencies are cached on the lockfile, browser setup was measured, and the app is built once per pipeline
- failures upload report, traces, and screenshots with stated retention; no auth state is uploaded
- tests that passed on retry appear as flaky in the report and in an exported result
- a deliberate failure and a deliberate flake were pushed, and both produced the expected evidence
- PR and main durations are recorded before and after, and the PR job meets its budget
