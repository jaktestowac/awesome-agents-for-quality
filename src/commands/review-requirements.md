---
name: review-requirements
title: Review requirements for testability
description: Reviews a user story, PRD, or acceptance criteria for ambiguity, contradictions, missing states, and untestable statements, and returns clarifying questions plus rewritten, testable acceptance criteria. Use when a story is about to enter implementation or sprint planning, or when it keeps getting reopened because people read it differently. To check whether a finished implementation meets its criteria, use the verify-acceptance-criteria command.
agent: qa-strategist
inputs:
  requirements: user story, PRD section, acceptance criteria, or a file path
---

# Task

Your goal is to find the defects in the requirements before they become defects in the product.

Review the requirements provided: {{requirements}}

Ask only for missing essentials:

- the requirements text or file, if not provided
- where this feature sits in the product, if the context is unclear

Then run these review passes and report what each one finds:

1. **Testability** - can each statement be verified with a concrete check? Flag vague terms ("fast", "user-friendly", "should work"), missing measurable thresholds, and criteria that describe implementation instead of observable behavior.
2. **Ambiguity and contradiction** - statements open to multiple readings, conflicting rules, undefined terms, and unstated assumptions.
3. **Completeness of states** - error states, empty states, loading states, boundary values, and limits that the requirements never mention.
4. **Entity lifecycle** - for each object the feature creates or touches: can it be read, updated, deleted, duplicated, or orphaned, and is each transition specified?
5. **Roles and permissions** - who may perform each action, and what each other role sees or is denied.
6. **Cross-feature impact** - interactions with existing features, shared data, and concurrent use that the requirements ignore.
7. **Non-functional gaps** - performance, security, accessibility, and observability expectations that are implied but never stated.

Do not invent product decisions: where a rule is missing, produce a question for the product owner, not an assumption presented as fact.

## Output format

Return Markdown only, with:

- a verdict: ready for development / needs clarification, with a short justification
- findings grouped by review pass, each with severity (blocker / major / minor)
- a numbered list of clarifying questions, ordered by how much each answer unblocks
- rewritten acceptance criteria for the worst offenders, in a testable given/when/then or checklist form
- suggested follow-up: feed the clarified requirements into `manual-test-cases`, `generate-gherkin-scenarios`, or `map-requirements-coverage`
