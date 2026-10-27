# Pipeline Speed Budget

A pipeline slows down one reasonable addition at a time. A written budget per trigger, and a measurement after each change, is what notices.

## Measure first

For the PR job and the main job, take the median of the last 10 runs and split it:

| Segment | Typical cause when large |
| --- | --- |
| Queue time | too few runners, or long jobs holding them; superseded runs not cancelled |
| Checkout + dependency install | no package-manager cache, or a cache key that never hits |
| Browser install | full download every run; OS deps reinstalled |
| App build | built in every shard instead of once |
| Server start | dev server compiling on demand; no readiness URL, so tests start late or time out |
| Test execution | too few workers for the runner, serial files, long tests, too many tests on this trigger |
| Artifact upload | videos for every test, `trace: 'on'` left in config |

Record the split in the PR that changes the pipeline. "Faster" without numbers is not a measurement.

## Levers, cheapest first

1. **Cancel superseded runs.** Concurrency group per branch. Free, and it shortens queues for everyone.
2. **Fix the caches.** Lockfile-keyed dependency cache; measure browser cache vs container image.
3. **Build once.** One build job, artifact passed to test jobs.
4. **Move tests to the right trigger.** The PR job runs smoke and affected areas; the full suite moves to main or nightly. Usually the biggest single saving.
5. **Push tests down a layer.** An E2E test that checks a validation message belongs in a component or API test; see `designing-test-automation-architecture`.
6. **Tune workers.** Match the runner's cores; `fullyParallel: true` unless a file genuinely needs serial order. More workers than cores is slower.
7. **Shard.** When one machine at full workers still exceeds the budget. Each shard pays setup time again, so stop when setup dominates.
8. **Fix the slowest tests.** List the slowest tests from the JSON report; a test that waits on durations or logs in through the UI is usually the cause. Auth via a setup project and `storageState`, not a UI login per test.
9. **Bigger runners.** Last, because it hides the causes above and costs every run.

## What not to trade for speed

- turning traces or failure screenshots off
- dropping the merge job
- cutting the PR selection below the journeys that would stop users
- raising retries so red runs stop costing a rerun
- `maxFailures` on the main job: stopping early on main hides how much broke. It is reasonable on PR jobs to give fast feedback, if the full run happens on merge.

## Budget record

```markdown
| Trigger | Budget | Median before | Median after | Change |
| --- | --- | --- | --- | --- |
| PR | 10 min | 23 min | 9 min | full E2E moved to main; smoke + affected on PR |
| main | 20 min | 31 min | 16 min | build once; 4 shards; blob + merge |
```
