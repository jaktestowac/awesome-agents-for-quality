# Orchestration Pack Quality Checklist

Run before shipping a pack.

## Justification

- [ ] At least two of the conditions hold: different tool needs, fresh context per phase, real parallelism, review independence, or length.
- [ ] A single custom agent was considered and rejected for a stated reason.
- [ ] Every agent has a scope no other agent in the pack has.
- [ ] No role exists only because the workflow diagram had a box for it.

## Naming

- [ ] Agent names are prefixed with a short pack name and unique across the whole collection (packs and standalone agents), because Codex keeps all agents in one folder.
- [ ] Every agent has a `title`, unique within the pack; titles read as roles ("Test Planner"), not commands ("Plan Tests").
- [ ] The pack name describes the workflow, not the domain.

## Wiring (Copilot)

- [ ] Every `copilot.agents` entry and `copilot.handoffs[].agent` exactly matches a `title` in this pack (spaces, capitalisation, parentheses included), or is `"*"`.
- [ ] Only the orchestrator lists subagents; subagents set `user-invocable: false`.
- [ ] Handoffs have an action label, a short prompt that references the finished work, and `send: false`.
- [ ] The orchestrator's tools include everything its subagents need, because they act as a ceiling.

## Portability (Claude Code and Codex)

- [ ] The orchestrator's instructions delegate by role title, not by a tool name of one host.
- [ ] No subagent's instructions require calling another subagent; results come back to the orchestrator, which passes them on.
- [ ] Hand-offs written as subagent `handoffs` back to the orchestrator are a Copilot convenience only; the pack still works without them.
- [ ] For a hand-written pack: the orchestrator exists as a user-run skill for Claude Code and Codex, with a title → agent-name table.

## Capabilities

- [ ] Each grant is the minimum the role needs.
- [ ] Every agent that runs commands or tests has `execute`.
- [ ] Every agent that writes a file, including its own findings file, has `edit`.
- [ ] Reviewers and explorers have no `execute`; reviewers have no `edit`.
- [ ] Any MCP server (such as Playwright) is declared with `mcp` and named as a prerequisite in `GUIDE.md` or the pack description.

## Output contract

- [ ] Every subagent names the same Handoff Packet sections.
- [ ] `Gaps` is required, and the body says uncertainty goes there rather than into a hedge.
- [ ] `Artifacts` requires paths, all under one agreed folder (the packs here use `.ai-outputs/`).
- [ ] The orchestrator's body defines its final summary.
- [ ] The orchestrator sends an incomplete packet back, with a retry cap, rather than filling it in.

## Scope boundaries

- [ ] The orchestrator states plainly that it does not implement.
- [ ] Any reviewer is separate from the implementer.
- [ ] The orchestrator stops for user approval at decision points.
- [ ] No agent merges, pushes or deploys unless that is the pack's declared purpose.

## Repository checks (this collection)

- [ ] `pack.yaml` has `name` (equal to the folder), `title`, `description` and an `orchestrator` that exists in `agents/`.
- [ ] `copilot:` blocks use only `handoffs`, `agents`, `user-invocable`, `argument-hint`, `target`, `mcp-servers`.
- [ ] The pack name is not also a bundle name in `bundles.yaml`.
- [ ] `npm run validate` passes.

## The live run

Validation proves the wiring resolves. Only a run proves the pack works. Run it on a real task in each target host and check:

- [ ] **The orchestrator stayed out of the work.** If it started implementing, a subagent returned something too thin or the orchestrator's instruction is too weak.
- [ ] **Every subagent returned a complete packet.** An always-empty `Gaps` section means the contract is decorative.
- [ ] **No two agents did the same work.**
- [ ] **Every hand-off prompt was actionable.** A subagent that had to ask what it was for has a prompt problem.
- [ ] **Parallel steps were independent.**
- [ ] **The final summary is usable** by someone who did not watch the run.
- [ ] **Artifacts landed in the agreed folder**, not the repository root.

## Smells that mean a rewrite

- an orchestrator whose body contains implementation instructions
- a subagent granted every capability "to be safe"
- two agents whose descriptions are hard to tell apart
- a hand-off prompt that only restates the agent's name
- five agents where the work is two phases
- an agent name that duplicates another pack's
