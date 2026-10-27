---
name: test-plan-basic
description: Produces a quick, single-pass test plan for a website from a short read-only exploration of its main flows, saved to .qa/basic-test-plan.md. Use when you need a starting plan for a small site, a smoke checklist, or a first pass before deeper planning. For a comprehensive, risk-prioritized plan with API scenarios and review rounds, use the create-test-plan command.
argument-hint: "[baseUrl]"
disable-model-invocation: true
---

# Generate a basic test plan

## Inputs

Take these from what the user typed after the command, or from the conversation. Ask for any you need that are missing.

- `baseUrl`: URL of the website to plan for (must be a site you are authorized to test)

# Task

Explore the website at <baseUrl> and write a basic test plan for its main features in one pass.

If no URL is provided, ask for one and stop until you have it. If the main features sit behind a login, ask for a test account; without one, plan only the public part and say so.

## Steps

1. Explore the site with Playwright: home page, main navigation, and up to 5 key user flows (e.g. search, sign-up, checkout, contact form). Stay read-only.
2. For each flow, note the main interactions and what a user expects to happen.
3. Write 3–6 test cases per flow: the happy path, one or two negative cases (invalid or missing input), and one boundary case where the flow has an input with limits.
4. Note what you did not explore and what you could not verify.

## Output

Save the plan to `.qa/basic-test-plan.md` (ask before overwriting an existing file):

```markdown
# Basic test plan: <site>
URL: <url> · Date: <date> · Explored: <flows>

## Scope
In scope: … · Out of scope / not explored: …

## Test cases
| ID | Flow | Title | Steps | Expected result | Priority |
| BAS-01 | Search | Search returns matching products | 1. … | … | P1 |

## Open questions
```

Then give the file path and the number of cases per flow. The plan can feed the `test-generator` command.

## Guardrails

- Explore only sites you own or are authorized to test.
- Do not submit forms that create real records, send messages, or make purchases; plan those cases without executing them.
- Write expected results only from observed behaviour or obvious conventions; put anything uncertain under open questions.
- Stop after 5 flows.
