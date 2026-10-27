# Custom Agent Quality Checklist

Run this before handing off an agent.

## Role and description

- [ ] One role and one output format. A second role is a second agent.
- [ ] The description says what the agent does and when to use it, and routes the nearest neighbour.
- [ ] A role line, if present, is followed by real scope, rules and an output contract.

## Tools

- [ ] Every tool or capability is used by the workflow; each has a reason.
- [ ] A read-only reviewer has no edit and no execute.
- [ ] The tool list is explicit (no list usually means all tools).
- [ ] Any MCP server the agent uses is declared and documented as a prerequisite.

## Behaviour

- [ ] Scope says what the agent owns and what it hands off, by exact name.
- [ ] Long procedures live in a skill the agent uses by name, not in the agent body.
- [ ] Stop conditions exist: missing input, out of scope, and a retry cap.
- [ ] Destructive actions need confirmation.
- [ ] The output contract is exact (sections or a table), not "a report".

## Host fit

- [ ] No model is pinned unless the user asked for one.
- [ ] The body names capabilities, not one host's tool names.
- [ ] The body does not ask the agent to start other agents unless the only target is Copilot.
- [ ] **This collection:** `src/agents/<name>.md` uses only the keys in `CONTRIBUTING.md`, is in one bundle, and `npm run validate` passes.
- [ ] **A user's project:** the file is in the host's agent folder (`.github/agents/`, `.claude/agents/`, `.codex/agents/`), and for Codex the edit and shell limits are set.

## Smells that call for a rewrite

- "does everything" scope
- a long tool list added as a shortcut
- a skill's workflow copied into the agent body
- "iterate until all tests pass" with no cap
- no way to tell from the description when to choose this agent
