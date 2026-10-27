# Repository Instructions Template

Use this template for repository-wide guidance. Save the result as `.github/copilot-instructions.md` (Copilot), `CLAUDE.md` (Claude Code) or `AGENTS.md` (Codex); for a team on several tools, keep one tool-neutral copy.
Only keep information that should matter for most tasks in the repository.

## Repository at a glance

- **Purpose**: <what this repository exists to do>
- **Primary stack**: <languages, runtimes, frameworks, key tools>
- **Top-level folders**:
  - `<folder>/` - <responsibility>
  - `<folder>/` - <responsibility>

## Commands to prefer

- `<script or task>` - <when to use it>
- `<script or task>` - <when to use it>
- `<script or task>` - <verification step>

## Architecture rules

- Keep `<layer>` separate from `<layer>`.
- Add new `<artifact>` files under `<path>`.
- Reuse existing patterns from `<path>` before inventing a new abstraction.

## Implementation rules

- Prefer `<preferred pattern>` over `<avoided pattern>` because <reason>.
- Keep public APIs <style or stability rule>.
- When editing tests, follow `<test strategy>`.

## Data, config, and secrets

- Read configuration from `<config location>`.
- Never hardcode secrets; use `<approved mechanism>`.
- When environment variables are required, document them in `<path>`.

## Testing and quality gates

- Run `<command>` after changing `<scope>`.
- Add or update tests in `<path>` when behavior changes.
- Prefer `<assertion strategy>` over `<anti-pattern>`.

## Change hygiene

- Keep diffs small and focused.
- Do not reformat unrelated files.
- Update docs when public behavior, setup, or contributor workflows change.

## Notes for future editors

- Remove sections that are not useful.
- Replace placeholders with repository facts, not general advice.
- Move rules that only matter for some files into scoped rules (`.github/instructions/`, `.claude/rules/`, or an indexed `.agents/rules/` file for Codex).
