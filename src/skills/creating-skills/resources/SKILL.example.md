---
name: analyzing-test-reports
description: 'Groups the failures in a CI test report into a few root-cause clusters, labels each as product bug, test bug, infrastructure or unknown, and ranks the next checks. Use when a pipeline is red with many failures, when a suite fails intermittently and nobody knows whether it is flaky or broken, or when a release candidate needs a quick failure triage, even if the user only pastes a log. For fixing the failing tests themselves, use `stabilizing-flaky-tests`.'
argument-hint: 'Report file, CI run link or pasted log, and the time window to compare against'
---

# Analyzing Test Reports

Turns a pile of red results into a short, ranked investigation list.

## When not to use

- A single failing test with an obvious assertion error: read the error and fix it directly.
- The user wants the tests fixed, not triaged: hand off to `stabilizing-flaky-tests`.

## Workflow

### 1. Frame the failure set

- Identify the failing jobs, environments, commit and time window.
- Compare with the last green run on the same branch, if available.
- Done when: every failure is marked new or recurring.

### 2. Cluster

- Group by error message, stack frame, test target and shared dependency (service, fixture, data).
- One fault often appears under several test names; merge those into one cluster.
- Done when: each failure belongs to exactly one cluster.

### 3. Label and rank

- Label each cluster: product bug, test bug, infrastructure, or unknown. Give the evidence for the label.
- Rank by blast radius times confidence. Mark weak evidence explicitly instead of guessing.
- Done when: every cluster has a label, evidence and a rank.

### 4. Recommend the next checks

- For the top three clusters, name the smallest check that confirms or rules out the leading cause (re-run one test with tracing, query one log, diff one config).

## Output

```markdown
## Verdict
<one line: broken, flaky, or infrastructure, and how sure>

## Clusters
| # | Cluster | Tests | Label | Evidence | Next check |
| - | ------- | ----- | ----- | -------- | ---------- |
```

## Related Skills

- `stabilizing-flaky-tests`: when the cause is known and the tests need fixing
- `reporting-bugs`: to file a product bug found in a cluster

## Definition of Done

- Every failure is in exactly one cluster.
- Every cluster has a label backed by quoted evidence from the report.
- The top three clusters each have one concrete next check.
