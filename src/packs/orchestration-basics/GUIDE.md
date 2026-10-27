# Minimal Agent Orchestration Example

A small, readable example of multi-agent coordination: one orchestrator and three read-mostly helpers (Planner, Explorer, Analyst) for analysis, planning and documentation work. Start here to learn the pattern before adopting a larger pack.

Pick this pack to understand a codebase, assess risks or tech debt, or produce a phased plan. It does not implement code. For a pipeline that also implements, reviews and commits, use [`plan-explore-review-commit`](../plan-explore-review-commit/); for test automation, use [`ui-api-automation`](../ui-api-automation/).

## Architecture

```
┌─────────────────────┐
│  ORCHESTRATOR       │  intake → delegate → synthesize → decide
└──────────┬──────────┘
           │  (helpers never call each other; results come back here)
    ┌──────┴──────┬─────────────┐
    ▼             ▼             ▼
┌─────────┐ ┌──────────┐ ┌─────────┐
│ PLANNER │ │ EXPLORER │ │ ANALYST │
│ phased  │ │ find     │ │ patterns│
│ plan    │ │ files    │ │ & risks │
└─────────┘ └──────────┘ └─────────┘
```

| Agent | Role | Writes files | Returns |
| --- | --- | --- | --- |
| `Orchestrator` | Clarifies the objective, delegates, synthesizes, runs the stop gates | analysis or plan documents only | execution card, then a synthesis |
| `Planner` | Turns findings into a phased, test-first plan | plan `.md` files only | the plan, plus research it still needs |
| `Explorer` | Read-only, breadth-first codebase map | none | `<results>` block: files, findings, next steps |
| `Analyst` | Patterns, risks, opportunities, with evidence | analysis `.md` files only | analysis document |

Only the orchestrator delegates. When the Planner or the Analyst needs more discovery, it says what it needs and the orchestrator sends the Explorer. This keeps the same flow working in every tool, including those where a subagent cannot start another subagent.

## Starting the pack

See the plugin README: pick **Orchestrator** in Copilot's agent dropdown, run `/orchestration-basics` in Claude Code, or `$orchestration-basics` in Codex after copying the agents. Then describe the job, for example "Analyze this codebase for tech debt and modernization opportunities".

## Stop gates

The orchestrator pauses for your answer at three points:

1. **After intake**: it shows an execution card (objective, constraints, success criteria, which helpers it will use). Confirm or correct it.
2. **After the findings or the plan**: it presents the synthesis. Nothing further happens until you choose the next step.
3. **Before any change to files** other than the plan or analysis documents. This pack doesn't implement, so the answer is usually to hand the plan to another pack or do it yourself.

## Typical workflows

**Understand and analyze a codebase**

1. Orchestrator clarifies scope → stop gate 1.
2. Explorer maps structure and entry points; Analyst assesses patterns and risks, in parallel when independent.
3. Orchestrator synthesizes patterns, risks and opportunities → stop gate 2.

**Plan a feature or refactoring**

1. Orchestrator records the goal and constraints ("backward compatible, no database changes") → stop gate 1.
2. Explorer maps the affected files; Analyst assesses architectural trade-offs where they exist.
3. Planner writes the phased plan from those findings. If it lists research still needed, the orchestrator runs it and asks the Planner to update the plan, at most twice.
4. Orchestrator presents the plan → stop gate 2.

**Deep dive on one topic** (for example the security of authentication)

1. Explorer maps all related files.
2. Analyst assesses them against the concern.
3. Orchestrator groups findings, proposes mitigations → stop gate 2.

## Principles

- **Delegation saves context.** Broad file discovery goes to the Explorer; deep analysis to the Analyst; the orchestrator keeps its context for synthesis and decisions.
- **Parallel only when independent.** Explorer and Analyst can run together on separate questions; the Planner runs after the findings it depends on.
- **Evidence or it didn't happen.** Every finding cites file paths. Unknowns are listed, not filled in.
- **Fixed output shapes.** Each helper has an output contract (`<results>`, the analysis template, the plan template), which makes synthesis mechanical.

## Writing good delegations

Give each helper a goal, the context it can't discover itself, and what to focus on:

```
Explorer: find all files related to authentication.
Goal: understand where sessions are created and checked.
Focus on: route guards, middleware, test fixtures.
```

```
Planner: plan a phased implementation of server-sent events for order updates.
Context: Explorer results (attached); constraints: backward compatible REST API, no schema changes.
```

## Troubleshooting

- **The orchestrator does all the work itself.** Ask for exploration and analysis explicitly; the orchestrator should read fewer than five files on its own.
- **Findings are generic.** Narrow the request: "async error handling in the service layer", not "analyze the codebase".
- **Findings aren't grounded.** Ask for file paths and line numbers; the output contracts require them.

## Extending the pattern

Add a helper the same way: one role, a clear scope, minimal capabilities, an output contract, and a stop condition. [`plan-explore-review-commit`](../plan-explore-review-commit/) shows the result with an implementer, code reviewer, security auditor and docs writer added.
