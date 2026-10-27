---
name: map-requirements-coverage
title: Map requirements to test coverage
description: "Builds a requirements traceability matrix from a PRD, user stories, or acceptance criteria against the existing tests: what is covered, at which level, what is missing, and which gaps carry the most risk. Saves it to .qa/requirements-coverage.md. Use when someone asks whether a feature is really tested, before a release sign-off, or when auditing coverage against a spec. To check a finished implementation against its criteria, use the verify-acceptance-criteria command."
agent: test-planner
inputs:
  requirements: PRD, user stories, or acceptance criteria (text or file path)
---

# Task

If the `requirements-test-coverage-mapper` skill is installed, load it and follow its workflow.

Your goal is to answer one question with evidence: which requirements are actually covered by tests, and which only look covered.

Ask only for missing essentials:

- the requirements source: PRD, user stories, or acceptance criteria {{requirements}}
- where the tests live, if not discoverable in the workspace
- scope boundaries: which parts are explicitly out of scope

Then do the following:

1. Normalize the requirements into atomic, testable statements with stable IDs. Split compound requirements.
2. Search the workspace for tests related to each statement: unit, API, E2E, and manual test case documents.
3. Build the traceability matrix, marking each requirement as **covered**, **partially covered**, or **not covered**, with the covering test files cited as evidence. A test that merely touches the feature does not count as coverage - it must assert the required behavior.
4. Classify each gap by risk: business impact and likelihood of regression.
5. Recommend, for each significant gap, the cheapest test level that would close it and whether it is an automation candidate.

## Output format

Return Markdown only, with:

- a coverage summary: N covered / N partial / N not covered
- the matrix: `Req ID | Requirement | Coverage | Evidence (test files) | Level | Risk | Recommended action`
- the top gaps to close first
- open questions where requirement intent was unclear (candidates for the `review-requirements` command)

Save the matrix to `.qa/requirements-coverage.md` so it can serve as a living artifact.
