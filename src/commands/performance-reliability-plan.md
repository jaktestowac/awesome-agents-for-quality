---
name: performance-reliability-plan
title: Performance and reliability test planner
description: Designs a risk-based performance and reliability test strategy for a system's critical flows (objectives, workload types, and concrete smoke, load, stress, soak, and spike scenarios) and drafts scripts in the project's existing tool, defaulting to k6. Use when a system has no performance testing yet, before a launch or traffic event, or when SLOs exist but nothing checks them. Writes plans and scripts; runs nothing beyond a confirmed smoke check.
inputs:
  system: "system or service to plan for, and where its code lives (default: this repository)"
  targetEnvironment: "environment the tests would run against (default: staging; never production without written approval)"
---

# Task

Design a practical performance and reliability test plan for {{system}}, and draft the first scripts.

If the `testing-performance-and-load` skill is installed, load it before starting; it holds the workload-modelling, threshold, and analysis rules this command relies on.

## Inputs

Ask concise questions for anything missing; infer the rest from the codebase and say what you inferred.

| Input | Notes |
| --- | --- |
| System context | `{{system}}`: type (web app, API, services), stack, deployment |
| Target environment | `{{targetEnvironment}}`: must be named before any run |
| Traffic and goals | Peak users or requests/s, background jobs, SLOs/SLIs (latency, error rate, availability) |
| Known pain points | Timeouts, spikes, 5xx, slow endpoints from production |
| Existing tooling | k6, JMeter, Locust, Gatling, Artillery; CI platform; monitoring stack |

## Steps

Say which phase you are in at each step.

1. **Discover.** Search the codebase for key services and modules, existing performance or integration tests, and infrastructure config (Docker, Kubernetes, cloud). List the critical flows (login, search, checkout, high-volume endpoints, batch jobs) and where latency or throughput matters most. Ask me to confirm the list before continuing.
2. **Set objectives.** Per critical flow, propose p95/p99 latency, throughput, and error-rate targets. Mark each as from an SLO or as a proposed starting point. Map flows to workload types:
   - **smoke**: low volume, quick, after each change
   - **load**: sustained expected peak
   - **stress**: ramp until degradation, to find limits
   - **soak**: long, steady load, to reveal leaks and slow degradation
   - **spike**: sudden burst and drop
   Pause for my feedback.
3. **Design scenarios.** Reuse the tool already in the repo; if there is none, recommend one (k6 for HTTP APIs and web backends) and say why. For each scenario give: flows and their traffic mix, think time, ramp shape, duration, data needs, and pass/fail thresholds.
4. **Draft scripts** in the existing performance folder, or `tests/perf/` if none exists. Read base URLs and credentials from environment variables, and include thresholds (e.g. a k6 `thresholds` block) so a run can fail.
5. **Check the smoke script** only if I confirm the target environment and that a low-volume run is acceptable there. Report what ran and its result. Do not run load, stress, soak, or spike scenarios; hand me the command instead.

## Output

Save the plan to `.qa/performance-plan.md`:

```markdown
# Performance and reliability plan: <system>
Environment: <env> · Sources: <SLOs, traffic data, or "proposed">

## Critical flows
## Objectives
| Flow | Workload | p95 | p99 | Throughput | Error rate | Source |
## Scenarios
| ID | Type | Flows and mix | Ramp / duration | Thresholds | Cost and runtime |
## How to run
## Open questions and risks
```

Then list the script files created, the exact command for each scenario, and a minimal starting set (usually smoke plus load).

## Guardrails

- Plan and run only against systems you are authorized to test.
- Never run load, stress, soak, or spike tests without my explicit confirmation of the environment, window, and who needs to be told. Never against production, or shared environments that third parties depend on, without written approval.
- Never send traffic to third-party services (payment providers, email, analytics) from a load script; stub or exclude them.
- Report percentiles, not averages, and state when an environment differs from production enough to make a number a shape rather than a capacity.
- Stop after the plan, the scripts, and an optional confirmed smoke run.
