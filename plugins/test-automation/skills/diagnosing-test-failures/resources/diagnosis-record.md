# Diagnosis Record

One record per distinct failure. Redact every secret and personal datum as `<REDACTED>` before filling it in.

## Hypotheses

Write these before testing any. Rank by likelihood given the evidence.

| # | If this is the cause... | ...then this probe turns the loop green | ...and this makes it worse | Result |
| --- | --- | --- | --- | --- |
| 1 | | | | confirmed / ruled out / untested |
| 2 | | | | |
| 3 | | | | |

A row with no prediction is not a hypothesis yet.

## Record

```markdown
### <test name or reported symptom>

- **Where it fails:** local / CI (job, shard) / both. Constant or intermittent.
- **First seen:** <commit or date, if known>
- **Evidence preserved:** <error line, trace path, CI run link>
- **Class:** application defect | test bug | environment/config | flaky (handed to stabilizing-flaky-tests) | test data
- **Why this class:** <the evidence, one or two lines>
- **Loop command:** `<command>`  (red before, green after)
- **Minimised repro:** <the smallest scenario that still goes red>
- **Root cause:** <the confirmed hypothesis, one sentence>
- **Ruled out:** <hypotheses and the probe that excluded each>
- **Resolution:** <fix made / bug report link plus known-failure marker / config pinned / data setup changed>
- **Regression guard:** <test that fails without the fix, or "no correct seam" and why>
- **Can still fail:** <how the fixed test was shown to go red when the behaviour breaks>
- **Cleanup:** debug prefix `[DEBUG-xxxx]` searched and removed; harnesses deleted
- **Fix attempts:** <n of 3>
```

## Summary for several failures

| Test | Class | Root cause | Resolution | Status |
| --- | --- | --- | --- | --- |

Then list: bugs filed, tests marked as known failures (with links), failures handed to `stabilizing-flaky-tests`, and anything stopped at the attempt cap with the next check to run.

## When stopping without a cause

State plainly:

- what was tried, with the commands and their results
- which hypotheses remain and the probe that would test each
- what is needed to continue: environment access, an artifact, a decision on the expected behaviour
