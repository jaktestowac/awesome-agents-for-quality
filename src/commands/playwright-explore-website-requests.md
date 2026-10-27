---
name: playwright-explore-website-requests
title: Explore a website and gather network requests using Playwright MCP
description: Explores a website with Playwright MCP and records, for 3-5 core user flows, the user actions, locators, and the network requests and responses each action triggers, saved to .qa/website-requests-exploration-summary.md. Use when you need to know which API calls sit behind the UI, for example before writing API tests, network mocks, or a HAR-based setup. When network traffic is not needed, use the playwright-explore-website command.
mcp: [playwright]
inputs:
  url: URL of the site to explore (must be a site you are authorized to test)
---

# Task

Explore the website at {{url}}, exercise its core functionality, and record the network traffic behind each user action.

If no URL is provided, ask for one and stop until you have it. If the site needs login, ask for a test account; do not guess credentials.

## Steps

1. Navigate to the URL with the Playwright MCP tools.
2. Pick **3–5 key features or user flows** that represent the site's core functionality, and tell me which ones you picked and why.
3. For each flow, record:
   - the user actions performed, step by step
   - the UI elements involved and a user-facing locator for each (`getByRole`, `getByLabel`, `getByText`; `getByTestId` where those are ambiguous)
   - the network requests each action triggered: method, URL, status, relevant query parameters, request and response headers that matter (content type, auth scheme, caching), and request and response bodies (trimmed to the fields that matter)
   - the observed outcome
4. Separate first-party API calls from third-party traffic (analytics, ads, CDNs), and list the third-party hosts once rather than in every flow.
5. Close the browser when done, then write the file below.

## Output

`.qa/website-requests-exploration-summary.md`:

```markdown
# Network exploration: <site>
Date: <date> · Flows explored: <n> · API base URL(s): <…>

## <Flow name>
Steps: 1. … 2. …
| Step | Method | URL | Status | Purpose | Notes |
Request/response samples: …
Observed: …

## Endpoints seen
| Method | Path | Used by flows | Auth | Notes |

## Third-party hosts
## Not explored
```

End with the endpoints that look like the best candidates for API tests or for `page.route` mocks in UI tests.

## Guardrails

- Explore only sites you own or are authorized to test.
- Stay read-only by default. Do not submit forms that create real records, send messages, make purchases, or delete anything without my explicit confirmation.
- Do not replay, fuzz, or load-test the captured endpoints; this command only observes.
- Redact secrets before writing: replace tokens, cookies, `Authorization` and `Set-Cookie` values, API keys, and personal data with `<redacted>`.
- Stop after 5 flows, or earlier if the site blocks access, and list what you did not explore.
