# Skills per host

Read this when a skill is going into a user's own project, or when you want a host-specific extra. For skills in this collection, the source format in the repository's `CONTRIBUTING.md` wins: the build copies `src/skills/<name>/` unchanged into every host's plugin.

## What is the same everywhere

- A folder named after the skill, containing `SKILL.md` with YAML frontmatter and a Markdown body.
- `name` (lowercase, hyphens, max 64 characters, equal to the folder name) and `description` (max 1024 characters) are required and are all the agent sees before the skill triggers.
- Supporting files load only when the body points to them.
- The agent can pick a skill on its own when the description matches, or the user can run it by name.

## GitHub Copilot

| | |
| --- | --- |
| Project | `.github/skills/<name>/` (recommended); `.claude/skills/<name>/` is also read, for backward compatibility |
| Personal | `~/.copilot/skills/<name>/` (recommended); `~/.agents/skills/<name>/` and `~/.claude/skills/<name>/` are also read |
| Documented frontmatter | `name`, `description`, `license` |
| Where it runs | VS Code, Copilot CLI and the Copilot coding agent |
| Run by hand | `/name` |

## Claude Code

| | |
| --- | --- |
| Project | `.claude/skills/<name>/` |
| Personal | `~/.claude/skills/<name>/` |
| Plugin | `skills/<name>/` inside the plugin |
| Run by hand | `/name` |

Claude Code reads more frontmatter than the shared pair. The keys below exist in Claude Code; Codex has no direct equivalent for any of them (OpenAI's `migrate-to-codex` reference lists each as unsupported or manual):

| Key | Effect in Claude Code |
| --- | --- |
| `allowed-tools` | A tool allowlist for the skill (Codex has no skill-level allowlist) |
| `argument-hint` | Hint for what to type after the command when the user runs the skill by hand |
| `user-invocable` | Whether the user can run the skill by hand |
| `disable-model-invocation` | `true` keeps the agent from starting the skill on its own; only the user can run it |
| `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell` | Further Claude-only behaviour; avoid in a skill meant for several hosts |

Older Claude Code projects keep user-run prompts in `.claude/commands/<name>.md`. A skill with `disable-model-invocation: true` does the same job and also works as a skill folder in the other hosts; see `creating-prompts`.

## OpenAI Codex

| | |
| --- | --- |
| Project | `.agents/skills/<name>/` |
| Personal | `~/.agents/skills/<name>/` (this collection's install table); OpenAI's own skills also use `$CODEX_HOME/skills/<name>/` |
| Plugin | the folder the plugin manifest's `skills` path points to |
| Run by hand | `$name` |
| Frontmatter | `name` and `description`; keep host metadata out of the frontmatter |

Codex keeps host metadata outside `SKILL.md`, in `agents/openai.yaml` next to it:

```yaml
interface:
  display_name: "Analyze test reports"
  short_description: "Group CI failures and rank the causes"
  default_prompt: "Use $analyzing-test-reports to triage last night's failed run."
policy:
  allow_implicit_invocation: false   # only the user can start it, like disable-model-invocation
```

- Quote string values. `short_description` is 25 to 64 characters. `default_prompt` names the skill as `$name`.
- `dependencies.tools[]` can declare an MCP server the skill needs. It documents a dependency; it is not a permission boundary.
- `policy.allow_implicit_invocation` is the closest match to Claude Code's `user-invocable` / `disable-model-invocation`, with similar intent but not identical semantics.

## Writing one skill for all three

- Keep frontmatter to `name` and `description` (plus `license` if needed). Each extra key works in one host and is ignored or misread in the others.
- If the skill must only run on demand, express that per host: `disable-model-invocation: true` for Claude Code and `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for Codex. This collection's build does exactly that for every command.
- Name capabilities, not tools, in the body: "search the project", not a host's tool name.
- Ship supporting files as real files, not symlinks: Codex drops symlinks when it caches a plugin.
