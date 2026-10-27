# Quarantine Policy

Quarantine is containment: the test stops blocking merges while it stays visible, owned, and on a clock. Adopt this once per repository and link it from the suite README.

## When a test may be quarantined

All of these hold:

- it has been reproduced or observed failing on the same commit it passed on (it is flaky, not broken)
- a fix is not available within the current change, or the cause is still unknown after the bounded investigation
- it is blocking or regularly slowing other people's work

A test that fails every run is not a quarantine candidate. Fix it, mark it as a known failure with a bug link, or delete it with the lost coverage stated.

## Required fields

| Field | Rule |
| --- | --- |
| Owner | A named person. A team alias is allowed only if the team has a rota that picks a person. |
| Tracking issue | Link in the annotation and the issue title names the test. |
| Diagnosis | The class from the root-cause catalogue, or `cause unknown` with the runs already tried. |
| Observed rate | Failures per runs, and the source (CI history or local repeat). |
| Quarantined on | Date. |
| Expires on | Date. Default 30 days. One extension of up to 30 days, with a reason recorded in the issue. |
| Coverage at risk | One line: what behaviour is unprotected while this is quarantined. |

## Mechanisms

Pick one per repository and use it everywhere, so the inventory is one search.

### A tag and a separate, non-blocking job (preferred)

The test keeps running and keeps producing evidence; it just cannot block a merge.

```typescript
test('syncs the cart across tabs', {
  tag: '@quarantine',
  annotation: { type: 'issue', description: 'https://tracker.example/QA-412 owner=a.nowak expires=2026-11-30' },
}, async ({ page }) => {
  // ...
});
```

```bash
# Blocking job
npx playwright test --grep-invert @quarantine

# Non-blocking job: still runs, still reports, still uploads traces
npx playwright test --grep @quarantine
```

The non-blocking job must show its result where people look: a visible amber check, a report artifact, or a line in the PR summary. A job whose result nobody sees is a skip with extra steps. How to mark a job as non-blocking without swallowing its failure is covered in `generating-quality-gate-workflows`.

### `test.fixme` with the link

Use when running the test is harmful (it corrupts shared data, or takes minutes to time out).

```typescript
test('exports the monthly report', async ({ page }) => {
  test.fixme(true, 'QA-418 owner=j.kowalska expires=2026-11-30: export job collides with nightly import');
  // ...
});
```

This produces no new evidence while quarantined, so the owner must reproduce manually before closing.

### What not to use as quarantine

- a `retries` override on the test or project: the test now passes and the report shows a flake count nobody reads
- `test.skip` with no reason, or a commented-out test
- deleting the test
- raising its timeout or adding `test.slow()`

## Expiry and exit

On or before the expiry date, exactly one of these happens:

1. **Fixed**: proven under the reproducing configuration, tag or `fixme` removed in the same change, issue closed with the evidence.
2. **Extended once**: reason recorded, new date set.
3. **Deleted**: the test is removed and the issue records the coverage that went with it, and whether another test covers it.

Expired quarantines are findings. List them in the quality report and in the waiver inventory (`governing-quality-waivers`); do not quietly bump the date.

## Inventory

Report quarantine count and the age of the oldest quarantined test alongside the flake rate. A falling flake rate with a rising quarantine count is the quarantine doing the work, not the fixes.

```bash
npx playwright test --grep @quarantine --list
rg -n "test\.fixme\(" tests/
```
