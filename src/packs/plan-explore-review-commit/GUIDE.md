# Plan, Explore, Review, Commit Pack

A multi-agent delivery workflow for feature and refactoring work: discovery → architecture and plan → test-first implementation → review → quality gates → commit → documentation, one small phase at a time, with a stop for your approval before every commit.

Pick this pack when the work should land as several reviewed commits. To learn the orchestration pattern, or for analysis and planning without implementation, start with [`orchestration-basics`](../orchestration-basics/). For UI and API test automation, use [`ui-api-automation`](../ui-api-automation/).

## What you get

### Orchestration and planning
- **Orchestrator Agent**: runs the lifecycle **Discover → Plan → Implement → Review → Commit → Verify** and stops for you at each gate. It never commits; it hands you a commit message.
- **Planner Agent**: writes a phased, test-first plan with risks, NFRs and acceptance criteria into the plan directory, then hands off to the Orchestrator Agent. Can be started on its own when you only want a plan.

### Research and design
- **Explorer Subagent**: fast, read-only discovery of files, usages and patterns.
- **Researcher Subagent**: deeper reading of a subsystem: conventions, prior art, risks.
- **Architect Subagent**: ADR-ready options and trade-offs, NFR impact, a light threat model.
- **QA Strategy Subagent**: test levels, coverage map, quality gates, flakiness mitigation.

### Delivery and assurance
- **Implementer Subagent**: implements exactly one phase test-first, runs the project's gates, proposes a commit message. Makes at most three fix attempts before reporting a blocker.
- **Code Review Subagent**: reviews the phase's changes and returns APPROVED, NEEDS_REVISION or FAILED. Never edits.
- **Security Auditor Subagent**: threat-model-light review of changes touching auth, input, secrets or dependencies. Never edits.
- **Docs Writer Subagent**: README sections, usage examples and release notes from the change set.

## Starting the pack

See the plugin README: pick **Orchestrator Agent** in Copilot's agent dropdown, run `/plan-explore-review-commit` in Claude Code, or `$plan-explore-review-commit` in Codex after copying the agents. In Copilot you can also start with **Planner Agent** and use its handoff to the Orchestrator Agent.

## How a run goes

1. **Intake**: the orchestrator restates the objective, constraints and definition of done as an execution card.
2. **Discover**: Explorer first, then Researcher, Architect or QA Strategy where the task needs them, in parallel when independent.
3. **Plan**: 3-10 phases, each with files, tests to write and acceptance criteria, saved to the plan directory (`plans/` unless `AGENTS.md` names another). **Stop:** you approve the plan.
4. **Per phase**: Implementer → Code Review (→ Security Auditor / QA Strategy when relevant). A NEEDS_REVISION result goes back to the Implementer, at most twice; after that the orchestrator stops and shows you the open issues. **Stop:** you get a phase summary and a commit message, and you commit.
5. **Closeout**: Docs Writer if user-facing behaviour changed, then a plan-complete summary. **Stop.**

Subagents never call each other: every result comes back to the orchestrator, which passes on what the next agent needs. This keeps the flow the same in every tool.

## Typical requests

- `Build <feature>. Constraints: backward compatible API, no schema changes.`
- `Plan only: <feature> with TDD, include risks and test strategy.` (the orchestrator stops after the plan)
- `Analyze the project for tech debt and maintainability issues, then plan the fixes.`

## Best practices

- Keep phases small: one red-green-refactor cycle per phase, so each commit is reviewable on its own.
- Let Explorer and Researcher run in parallel on large or unfamiliar code.
- Read the plan before approving it; the plan is the cheapest place to change direction.
- Commit at each gate. Skipping the gate merges phases and makes review and rollback harder.

## Design principles

- **Context conservation**: heavy reading is delegated and summarized.
- **Structured outputs**: each agent returns a fixed format (`<results>`, review status, implementation report), so synthesis is mechanical.
- **Tool minimalism**: reviewers and auditors are read-only; only the Implementer runs commands and edits code.
- **Bounded loops**: fix attempts and review rounds are capped, and the orchestrator reports instead of looping.
