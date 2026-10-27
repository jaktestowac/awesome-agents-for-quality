---
name: create-test-plan
title: Generate a comprehensive test plan
description: Explores a web app (and its API, if given), maps features to risk, and produces a prioritized test plan with web and API scenarios, saved to .qa/test-plan.md. Use when starting test work on a new product or major feature, or when a plan must feed test-generator or manual-test-cases. For a quick single-pass plan from light exploration, use the test-plan-basic command.
agent: test-planner
mcp: [playwright]
inputs:
  baseUrl: web app URL to explore (required)
  apiBaseUrl: API base URL (optional; web-only plan if omitted)
  environment: "dev, stage, or prod (default: stage; prod is read-only)"
  userRoles: main user roles, e.g. guest, customer, admin (optional)
  scope: features in and out of scope (optional)
  riskAreas: known high-risk or business-critical areas (optional)
---

# Task

Prepare a risk-prioritized test plan for the website at {{baseUrl}} and, if given, its API at {{apiBaseUrl}}.

## Inputs

| Input | Value | If missing |
| --- | --- | --- |
| Web app URL | {{baseUrl}} | Ask for it and stop until you have it |
| API base URL | {{apiBaseUrl}} | Plan web and exploratory testing only |
| Environment | {{environment}} | Assume stage and say so |
| User roles | {{userRoles}} | Infer from the UI and list them as assumptions |
| Scope | {{scope}} | Cover what exploration finds and mark scope as unconfirmed |
| Risk areas | {{riskAreas}} | Derive from business impact and say so |

Before interacting with forms or data, confirm that write actions are safe in this environment. In production, explore read-only.

## Steps

1. Explore the application with Playwright: key user flows, roles, forms, and states. If an API base URL was given, read its docs or OpenAPI spec if available and note the main endpoints and auth model; send only safe read requests (GET) unless write actions were confirmed.
2. Map features to risk: high, medium, or low, from business impact and likelihood of failure. State the reason for each high rating.
3. Build the plan:
   - scope, assumptions, and out-of-scope areas
   - prioritized scenarios per feature: happy path, negative, boundary, permission
   - API scenarios when applicable: contract, auth, error handling
   - suggested test level and automation candidates
   - open questions and information gaps
4. Show me the plan and ask for feedback. Apply the changes, then ask again. Stop when I confirm it is complete, or after three rounds, listing what is still open.

## Output

Save the final plan to `.qa/test-plan.md` with this structure:

```markdown
# Test plan: <app name>
Environment: <env> · Date: <date> · Explored: <pages/flows visited>

## Scope and assumptions
## Risk map
| Area | Risk | Why |
## Scenarios
| ID | Area | Scenario | Type | Priority | Level | Automate? |
## API scenarios
## Open questions
```

Use stable scenario IDs (e.g. `CHK-003`) and priority tags (`P1`–`P3`) so the plan can feed the `test-generator` or `manual-test-cases` commands.

## Guardrails

- Explore only applications you are authorized to test.
- Do not create, delete, or pay for anything, and do not run load or security probes, without explicit confirmation.
- Do not invent product rules: anything you could not confirm by exploring goes under open questions.
