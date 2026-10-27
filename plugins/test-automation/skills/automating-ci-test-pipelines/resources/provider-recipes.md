# Provider Recipes

Working shapes for sharded Playwright runs with one merged report. Pin action versions and images in your repository; the major versions here are the ones current when this was written, so check them before copying.

## GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: e2e

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

env:
  CI: true

jobs:
  test:
    timeout-minutes: 25
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci

      - name: Get Playwright version
        id: pw
        run: echo "version=$(npx playwright --version | awk '{print $2}')" >> "$GITHUB_OUTPUT"

      - name: Cache browsers
        id: browser-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: pw-${{ runner.os }}-${{ steps.pw.outputs.version }}

      - name: Install browsers and OS dependencies
        if: steps.browser-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps

      - name: Install OS dependencies only
        if: steps.browser-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps

      - name: Run shard
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

      - name: Upload blob report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 1

      - name: Upload failure artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.shardIndex }}
          path: test-results/
          retention-days: 7

  merge-reports:
    if: ${{ !cancelled() }}
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci

      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - run: npx playwright merge-reports --reporter=html,json ./all-blob-reports
        env:
          PLAYWRIGHT_JSON_OUTPUT_NAME: results.json

      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            results.json
          retention-days: 14
```

Notes:

- `fail-fast: false` keeps the other shards running when one fails, so the merged report is complete.
- Blob artifact names must be unique per shard, or the uploads collide.
- The trace files referenced by the HTML report are included in the blob reports, so the merged report can open them.
- If the browser cache restore is not measurably faster than `npx playwright install --with-deps`, drop the cache steps or run the job in `mcr.microsoft.com/playwright:v<version>-noble` instead.

### Building once

```yaml
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: app-build, path: dist/, retention-days: 1 }
  # test: needs: build, then download-artifact app-build and start it in webServer
```

### Path-filtered job

```yaml
on:
  pull_request:
    paths:
      - 'src/checkout/**'
      - 'tests/e2e/checkout/**'
```

On GitHub, a required check whose workflow is skipped by a path filter stays pending and blocks the merge. Coordinate with `generating-quality-gate-workflows` before making a filtered job required.

## GitLab CI

```yaml
e2e:
  image: mcr.microsoft.com/playwright:v1.56.0-noble   # match the version in package.json
  stage: test
  parallel: 4
  variables:
    CI: "true"
  cache:
    key:
      files: [package-lock.json]
    paths: [.npm/]
  script:
    - npm ci --cache .npm --prefer-offline
    - npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
  artifacts:
    when: always
    expire_in: 1 day
    paths: [blob-report/, test-results/]

merge-reports:
  image: mcr.microsoft.com/playwright:v1.56.0-noble
  stage: report
  needs: [e2e]
  when: always
  script:
    - npm ci --cache .npm --prefer-offline
    - npx playwright merge-reports --reporter=html,junit,json ./blob-report
  variables:
    PLAYWRIGHT_JUNIT_OUTPUT_NAME: results.xml
    PLAYWRIGHT_JSON_OUTPUT_NAME: results.json
  artifacts:
    when: always
    expire_in: 14 days
    paths: [playwright-report/, results.json]
    reports:
      junit: results.xml
```

`parallel: N` sets `CI_NODE_INDEX` (1-based) and `CI_NODE_TOTAL`, which map directly onto `--shard`. GitLab gathers artifacts from all parallel jobs into the `needs` consumer under the same path, so check that blob file names do not collide in your setup; the blob reporter names its files per shard by default.

## Verifying the pipeline

Push a throwaway branch with these two tests, check the evidence, then delete them.

```typescript
test('pipeline check: deliberate failure', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'This heading does not exist' })).toBeVisible();
});

test('pipeline check: deliberate flake', async ({}, testInfo) => {
  // Fails on the first attempt, passes on retry: should be reported as flaky
  expect(testInfo.retry).toBeGreaterThan(0);
});
```

Expected: the job is red for the first test, the merged report shows it with a trace; the second test shows as flaky in the HTML report and is counted in `stats.flaky` of the JSON output.
