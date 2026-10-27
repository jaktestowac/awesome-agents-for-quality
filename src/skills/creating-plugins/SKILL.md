---
name: creating-plugins
description: "Packages skills, commands, agents, hooks and MCP servers as installable plugins with a marketplace for GitHub Copilot, Claude Code and OpenAI Codex: choosing what to bundle, writing each host's manifest and marketplace entry, and checking the result installs. In this collection, plugins are generated from `bundles.yaml` by `npm run build`. Use when a skill or group of assets should install as a unit, when adding or reshaping a bundle here, when publishing a plugin from your own repository, or when CI reports generated plugin files out of date. For the skill being packaged, use `creating-skills` first."
argument-hint: "What to bundle, the plugin name and description, the target tools, and whether this is this collection or your own repository"
user-invocable: true
---

# Creating Plugins

A plugin is a folder of agent assets with a manifest; a marketplace is a file that lists plugins so users can add the source once and install by name. All three hosts have both, with different manifest locations and fields. A skill folder is the part that ports unchanged; agents, commands, hooks and MCP config need host-specific files.

## Where you are writing

**This collection.** Plugins are generated; never edit `plugins/`, the three marketplace files or the README tables by hand.

| You change | Effect |
| --- | --- |
| `bundles.yaml`: a bundle with `icon`, `description`, `skills`, `commands`, `agents`, optional `guides`, `mcp` | One plugin per bundle, for every host |
| `src/packs/<name>/` | One plugin per orchestration pack (`creating-orchestration-packs`) |
| `src/hooks/<name>/` | One opt-in Claude Code plugin per hook, plus a Copilot copy-in folder (`creating-hooks`) |
| `package.json` `version` | The version of every plugin and marketplace entry |

Every skill, command and agent belongs to exactly one bundle. Then run `npm run validate`, `npm run build`, `npm run check`, and commit the sources and the regenerated files together; CI runs `npm run lint` and fails if they differ. What the build writes per bundle is in [`resources/plugin-manifest.template.md`](resources/plugin-manifest.template.md).

**A user's own repository.** Write the manifests and marketplace files yourself, per target host, from [`resources/plugin-manifest.template.md`](resources/plugin-manifest.template.md). Keep one source for each skill and copy it into the plugin with a script, so the copies cannot drift.

## Decide the bundle

A plugin ships one capability or a small group a user reaches for together.

| Shape | Justified when |
| --- | --- |
| One skill | It stands alone |
| A skill and its quick variant | The pair covers routine and deep use of the same capability |
| Several cooperating assets | A user reaching for one reliably needs the others in the same session (a skill, the command that starts it, the agent it hands to) |

Grouping by topic is not a reason. "All the testing skills" installs fifteen descriptions that compete for the same requests, and the agent picks worse than it would from three. Before bundling, check that the skills' descriptions do not overlap; inside one plugin they collide harder, because the user installed both on purpose.

Keep a command and the agent it names with `agent:` in the same bundle; otherwise the command's hand-off fails when only one plugin is installed.

## Write the description

The plugin description is what a user reads before installing, often the only thing. Say what is inside and when to install it, in a sentence or two: "Unit tests, TDD, Playwright, mocking, visual regression, migration and test code review." beats "Testing tools". In this collection it comes from the bundle's `description` in `bundles.yaml` and is copied into every manifest and marketplace file.

## Per-host summary

| | GitHub Copilot | Claude Code | OpenAI Codex |
| --- | --- | --- | --- |
| Plugin manifest | `.github/plugin/plugin.json` | `.claude-plugin/plugin.json` | `.codex-plugin/plugin.json` (OpenAI's plugin-creator); this collection's build writes `plugin.json` at the plugin root instead |
| Marketplace file | `.github/plugin/marketplace.json` | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` |
| Skills | listed in `skills: ["./skills/<name>/"]` | `skills/` folder | `skills` path in the manifest |
| Agents | listed in `agents: ["./.github/agents/"]` | `agents/` folder | Not loaded from plugins: ship TOML files for users to copy into `.codex/agents/` |
| Hooks | Not shipped in plugins by this collection; copy-in folder | `hooks/hooks.json` | `hooks` path in the manifest; this collection ships none |
| MCP servers | Users add them to their own MCP config | `.mcp.json` | `mcpServers` path (this collection writes `mcp.json`) |
| Add marketplace | `copilot plugin marketplace add <owner>/<repo>` | `/plugin marketplace add <owner>/<repo>` | `codex plugin marketplace add <owner>/<repo>` |
| Install | `copilot plugin install <plugin>@<marketplace>` | `/plugin install <plugin>@<marketplace>` | `codex plugin add <plugin>@<marketplace>`, or pick it from the plugin list |

Plugin files must be real files, not symlinks: Codex drops symlinks when it caches a plugin. Manifest fields, marketplace entry shapes and sources: [`resources/plugin-manifest.template.md`](resources/plugin-manifest.template.md).

## Workflow

### 1. Check the assets are ready

Each skill passes its own checklist (`creating-skills`) and has been used on a real task at least once. A skill still changing weekly makes every edit a release.

### 2. Shape the bundle

Apply the table above. Done when every asset has one home and no two skills in the bundle compete for the same request.

### 3. Write or generate the manifests

- This collection: edit `bundles.yaml` only, then `npm run validate` and `npm run build`.
- A user's repository: write the manifest and marketplace entry for each target host from the template. The plugin `name` equals its folder name and its marketplace entry name.

### 4. Write the README

In this collection the plugin README is generated from the bundle. In a user's repository, use [`resources/plugin-readme.template.md`](resources/plugin-readme.template.md): the problem in one paragraph, what is inside (each skill and its resources, each command, each agent), install commands per host, prerequisites (MCP servers, Node.js), and related plugins.

### 5. Verify

- This collection: `npm run validate`, `npm run build`, `npm run check` all pass.
- Any repository: add the marketplace from a local path or the repository in each target host, install the plugin, start a new session, and confirm that one skill triggers and one command runs.

## Common failure modes

- editing a generated file under `plugins/` in this collection; the next build overwrites it and CI fails until then
- bundling by topic, so one plugin ships a dozen competing descriptions
- a command whose `agent:` lives in another bundle
- a description that names the topic but not what is inside or when to install
- expecting Codex to load agents, or Copilot to start MCP servers, from a plugin
- symlinked skill folders that vanish in Codex
- one skill installed both by hand and as a plugin, so it loads twice
- different versions in a manifest and its marketplace entry (in a hand-written setup)

## Resource map

- [`resources/plugin-manifest.template.md`](resources/plugin-manifest.template.md): manifests and marketplace entries for each host, what this collection's build writes, and sources. Read when writing or checking manifests.
- [`resources/plugin-readme.template.md`](resources/plugin-readme.template.md): README structure for a hand-written plugin. Read when publishing from your own repository.
- [`resources/plugin-packaging-checklist.md`](resources/plugin-packaging-checklist.md): pre-ship checks and a troubleshooting table. Read before publishing.

## Related Skills

- `creating-skills`: the skill has to be good before packaging matters
- `creating-custom-agents`: for agents shipped in the plugin
- `creating-prompts`: for commands shipped in the plugin
- `creating-hooks`: for hooks, which this collection ships as separate plugins
- `creating-orchestration-packs`: when the thing being packaged is a set of cooperating agents
- `generating-quality-gate-workflows`: for the CI job that checks generated files are current

## Definition of Done

- The bundle is one capability or a group used together; grouping by topic was rejected.
- Every command's `agent:` target is in the same plugin.
- The description says what is inside and when to install it.
- This collection: only `bundles.yaml` and `src/` were edited, every asset is in exactly one bundle, and `npm run validate`, `npm run build` and `npm run check` pass.
- A user's repository: each target host has a manifest and marketplace entry with matching name and version, skill folders are real files, and the plugin installed in a fresh session with one skill triggering and one command running.
