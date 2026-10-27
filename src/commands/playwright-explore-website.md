---
name: playwright-explore-website
title: Explore a website and propose test cases
description: Explores a website with Playwright MCP, documents 3-5 core user flows with their locators and observed behaviour, and proposes test cases for each, saved under .qa/. Use when you need a first look at an unfamiliar app before planning or automating tests. To also capture the network requests behind each flow, use the playwright-explore-website-requests command; for a full risk-prioritized plan, use the create-test-plan command.
mcp: [playwright]
inputs:
  url: URL of the site to explore (must be a site you are authorized to test)
---

# Task

Explore the website at {{url}}, document its core functionality, and propose test cases based on observed behaviour.

If no URL is provided, ask for one and stop until you have it. If the site needs login, ask for a test account; do not guess credentials.

## Steps

1. Navigate to the URL with the Playwright MCP tools.
2. Pick **3–5 key features or user flows** that represent the site's core functionality, and tell me which ones you picked and why.
3. For each flow, record:
   - the user actions performed, step by step
   - the UI elements involved and a user-facing locator for each (`getByRole`, `getByLabel`, `getByText`; `getByTestId` where those are ambiguous; CSS only as a last resort, marked as such)
   - the observed outcome, and what you would expect if it differs
4. Close the browser when done.
5. Write the files below only after the exploration is complete.

## Output

`.qa/website-exploration-summary.md`:

```markdown
# Exploration: <site>
Date: <date> · Flows explored: <n>

## <Flow name>
Steps: 1. … 2. …
| Element | Locator | Notes |
Observed: …
Issues or surprises: …

## Not explored
```

`.qa/proposed-test-cases.md`: per flow, a table `ID | Flow | Title | Steps | Expected result | Priority | Automate?`, with stable IDs (e.g. `LOGIN-01`) so the cases can feed the `test-generator` or `playwright-generate-test` commands.

## Guardrails

- Explore only sites you own or are authorized to test.
- Stay read-only by default. Do not submit forms that create real records, send messages, make purchases, or delete anything without my explicit confirmation.
- Do not run load, crawling, or security probes.
- Report only behaviour you observed; mark anything inferred as an assumption.
- Stop after 5 flows, or earlier if the site blocks access, and list what you did not explore.
