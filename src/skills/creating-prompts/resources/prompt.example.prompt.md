---
description: 'Reviews a draft test plan for missing risks, low-value scenarios and untested integration edges before implementation begins.'
name: 'review-test-plan-gaps'
agent: 'test-planner'
argument-hint: 'Draft plan (text or path), feature summary, known constraints'
---

<!-- Copilot format. The same command for Claude Code, Codex and this collection is in host-prompt-formats.md. -->

# Review test plan gaps

Strengthen a draft test plan before anyone automates it.

## Inputs

- Draft plan: `${input:draftPlan:Paste the plan or give a path}` - required. If missing, ask for it and stop.
- Feature summary: `${input:featureSummary:The feature or user journey}` - optional, default: infer from the plan and say so.
- Constraints: `${input:constraints:Environments, deadlines, out-of-scope areas}` - optional, default: none.

## Steps

1. Read the plan and list its intended coverage, assumptions and priorities. Done when each scenario is tagged with the risk it covers.
2. Find the gaps: boundary and invalid input, role and permission differences, failure of each integration, interrupted or repeated actions, existing data.
3. Rank the gaps by impact times likelihood, and mark scenarios that cover no stated risk as low value.
4. Reply in the format below. Do not rewrite the plan unless the user asks.

## Output

```markdown
## Verdict
<ready / ready with gaps / not ready> - <one line why>

## Gaps
| Priority | Gap | Plan section | Suggested scenario |
| -------- | --- | ------------ | ------------------ |

## Low-value scenarios
- <scenario> - <why it adds little>
```

## Guardrails

- Review only; do not edit the plan file or generate test code.
- Quote the plan section each gap refers to, so the author can verify it.

Next: pick the top two gaps and add them to the plan.
