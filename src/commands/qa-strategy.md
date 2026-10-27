---
name: qa-strategy
title: QA strategy - edge cases, security and attack scenarios
description: "Builds a scenario matrix for a feature, user story, or API spec across six lenses (happy path, boundary, negative, OWASP Top 10 security, adversarial sequences, data integrity), with an OWASP coverage table and open questions. Use when a feature handles input, auth, money, or shared data and you want its abuse cases listed before tests are written. For BDD edge cases around states and boundaries only, use the edge-case-scenario-generator command; for reviewing the requirements text itself, use the review-requirements command."
agent: qa-strategist
inputs:
  featureDescription: feature, user story, or API spec (text, URL, or file path)
---

# Task

Produce a QA strategy for the feature below that names concrete ways it can be abused, broken, or exploited, before any test code is written. Prefer specific scenarios over general advice.

**If any required input is missing, ask for it before proceeding.**

---

## Inputs to collect

| Input                           | Required | Notes                                                                         |
| ------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Feature / User Story / API spec | ✅       | Paste text, provide a URL, or give a file path: `{{featureDescription}}` |
| Authentication model            | ⬜       | Roles, token type, session mechanism                                          |
| Environment                     | ⬜       | dev / stage / prod - affects risk tolerance                                   |
| Known out-of-scope areas        | ⬜       | e.g., "skip load testing", "third-party SSO only"                             |

---

## What to produce

Work through the following steps in order:

### 1. Attack Surface Map

List every input, state transition, auth boundary, external dependency, and business rule exposed by the feature.

### 2. Scenario Matrix

For each surface, generate scenarios across **all six lenses**:

- 🔄 Happy path - one baseline scenario only
- 🔲 Boundary / Edge - min, max, off-by-one, null, overflow, Unicode
- ❌ Negative - invalid input, missing fields, wrong type, rejected transitions
- 🔐 Security - OWASP A01–A10: injection, IDOR, CSRF, auth bypass, SSRF
- ⚔️ Adversarial - race conditions, replay attacks, parameter tampering, privilege escalation
- 💥 Data Integrity - concurrent writes, partial failure, stale cache, orphaned records

Output as a table: `# | Surface | Lens | Scenario | Input/Action | Precondition | Expected Result | Risk 🔴🟠🟢`

### 3. OWASP Coverage Table

Map A01–A10 to the scenarios above. Mark each ✅ covered / ⚠️ partial / ❌ not applicable.

### 4. Blind Spots & Open Questions

List what is still unclear and must be answered before tests can be written.

### 5. Recommended Test Types

Suggest concrete tooling: unit, API, E2E, fuzzing, DAST, contract testing - matched to the findings.

---

## Guardrails

- This command designs scenarios; it does not execute attacks. Security scenarios are run later, and only against systems the team is authorized to test.
- Ground every scenario in the provided input. Where a rule is unknown, add it to Blind Spots instead of assuming behaviour.
- Mark OWASP categories as not applicable only with a one-line reason.

Return Markdown only. Stop after section 5.
