# Flake Record Template

One record per test, then one summary for the scope. Keep records in the tracking issue or next to the change; the summary goes in the pull request description.

## Per-test record

```markdown
### [test title] - `path/to/file.spec.ts:LINE`

- **Observed rate before**: [N failures / M runs] from [CI history, window | local repeat, command]
- **Failure messages**: [distinct messages, one line each]
- **Reproduced with**: `[exact command]` -> [result line, e.g. "4 failed, 46 passed"]
- **Did not reproduce with**: [configurations tried that stayed green]
- **Class**: [timing | shared state / order | data collision | environment | external | time / randomness | application race | cause unknown]
- **Evidence**: [what in the trace, log, or bisection points at the class]
- **Fix**: [one or two lines; what changed and why it removes the cause]
- **Proof**: `[same command as "Reproduced with"]` -> [result line, e.g. "50 passed"]
- **Masking removed**: [retry override / slow() / timeout / quarantine tag removed, or "none existed"]
- **Outcome**: [fixed | product bug filed: LINK, test marked fixme/fail | quarantined: owner, issue, expiry]
```

Illustrative example:

```markdown
### applies the discount - `tests/checkout.spec.ts:42`

- **Observed rate before**: 9 failures / 212 runs on main, last 30 days (CI history)
- **Failure messages**: `expect(received).toBe(expected) Expected: "90.00" Received: "100.00"`
- **Reproduced with**: `npx playwright test tests/checkout.spec.ts -g "applies the discount" --repeat-each=50 --workers=4 --retries=0` -> 6 failed, 44 passed
- **Did not reproduce with**: same command with `--workers=1` (50 passed)
- **Class**: timing
- **Evidence**: trace of a failing run shows `textContent()` read 30 ms before `POST /api/cart/discount` resolved
- **Fix**: replaced the one-shot read and `toBe` with `await expect(total).toHaveText('90.00')`
- **Proof**: same command -> 50 passed; whole file once -> 18 passed
- **Masking removed**: `test.slow()` on this test removed
- **Outcome**: fixed
```

Note why `--workers=1` stayed green here: the extra load from four workers widened the window, not shared data. That is why the proof reruns with four.

## Scope summary

```markdown
## Flaky test stabilization: [scope]

| Metric | Before | After |
| --- | --- | --- |
| Flake rate ([window], same definition) | [x%] | [y%] |
| Tests in quarantine | [n] | [n] |
| Oldest quarantine (days) | [d] | [d] |

| Test | Class | Outcome |
| --- | --- | --- |
| [title] | [class] | fixed / bug filed / quarantined until DATE |

**Product bugs found**: [links, or none]
**Cause unknown**: [tests, with the diagnostics added]
**Not attempted**: [tests in scope that were not worked on, and why]
```

If "after" is a local sample rather than CI history, say so; the CI number arrives only after the window has passed.
