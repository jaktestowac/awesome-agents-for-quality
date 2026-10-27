---
name: edge-case-scenario-generator
title: Edge Case Scenario Generator (BDD)
description: Generates risk-based Given/When/Then scenarios for one feature, weighted toward boundary values, invalid state transitions, and concurrency, and saves them to spec/edge-cases.md. Use when a feature with meaningful state (orders, payments, bookings, workflows) needs its edge cases enumerated before testing or automation. For a full .feature file from acceptance criteria, use the generate-gherkin-scenarios command; for security and adversarial lenses, use the qa-strategy command.
agent: ai-architect
inputs:
  feature: user story or feature description, or a file path
  states: the feature's application states, e.g. "Pending, Paid, Shipped, Cancelled" (optional; inferred if omitted)
---

# Task

Generate Given/When/Then scenarios for {{feature}} that cover the happy path, negative input, and the edge cases most likely to reach production: boundaries, invalid state transitions, and concurrency.

## Inputs

| Input | Value | If missing |
| --- | --- | --- |
| Feature or user story | {{feature}} | Ask for it and stop until you have it |
| Application states | {{states}} | Infer them from the feature and the codebase, list them as assumptions, and ask me to confirm before writing scenarios |

Example: "As a user, I want to pay for my order by credit card", with order states `Pending Payment`, `Processing`, `Paid`, `Cancelled`.

## Steps

1. **Happy path**: the single standard successful flow.
2. **Negative and validation**: invalid format, missing required fields, authentication failure, rejected input.
3. **Edge cases**:
   - boundaries and limits: minimum and maximum values, character limits, non-standard characters, type mismatch
   - concurrency: double submit, the same action in two sessions, parallel updates
   - invalid state transitions: acting on a wrong or terminal state (paying for an order that is already cancelled or shipped)
4. Give each scenario a risk rating (High/Medium/Low) and one line on why.
5. List the rules you could not infer and had to assume, so the product owner can confirm them.

## Output

Save one Markdown file to `spec/edge-cases.md` (ask before overwriting an existing file), with:

- a short header naming the feature and the states used
- scenarios grouped as Happy path / Negative / Edge cases, each with an ID, risk rating, and a Given/When/Then block:

```gherkin
# EC-04 · High · paying a cancelled order must not charge the card
Given an order in state "Cancelled"
When the user submits a valid card payment for that order
Then the payment is rejected with "Order is no longer payable"
And no charge is created
```

- an assumptions and open questions section

Aim for at least 8 scenarios, most of them negative or edge cases. Stop when every state transition and every input boundary you identified has at least one scenario, and say which ones you deliberately left out.

## Guardrails

- Write expected results from stated rules. Where a rule is unknown, write the question, not an invented behaviour.
- Generate scenarios only; do not write automation code.
