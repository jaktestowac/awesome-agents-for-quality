# Plugin Manifests and Marketplaces

Read this when writing manifests by hand for your own repository, or when checking what this collection's build generated. Examples use a plugin `exploratory-testing` in a marketplace `acme`.

## What this collection generates

`scripts/build.js` writes, for each bundle in `bundles.yaml`:

```
plugins/<bundle>/
├── plugin.json                      Codex (Agent Plugins schema)
├── .claude-plugin/plugin.json       Claude Code
├── .github/plugin/plugin.json       GitHub Copilot (lists skills and agents)
├── README.md                        generated from the bundle
├── skills/<skill>/                  byte-identical copy of src/skills/<skill>/
├── skills/<command>/SKILL.md        each command as a user-run skill, plus agents/openai.yaml for Codex
├── agents/<agent>.md                Claude Code agents
├── .github/agents/<agent>.agent.md  Copilot agents
├── codex/agents/<agent>.toml        Codex agents, for users to copy into .codex/agents/
├── .mcp.json, mcp.json              MCP servers for Claude Code and Codex
└── guides/<guide>.md                walkthroughs listed under the bundle's guides
```

and the three marketplace files `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` and `.github/plugin/marketplace.json`. `name` is the bundle key, `description` the bundle description, `version` the `package.json` version, `keywords` are derived from the bundle name. You never write these by hand here.

## GitHub Copilot

`<plugin>/.github/plugin/plugin.json`:

```json
{
  "name": "exploratory-testing",
  "version": "1.0.0",
  "description": "Session-based exploratory testing: charters, heuristics, session notes and debriefs.",
  "author": { "name": "Acme QA", "url": "https://example.com" },
  "repository": "https://github.com/acme/agent-plugins",
  "license": "MIT",
  "keywords": ["exploratory-testing", "charters", "qa"],
  "agents": ["./.github/agents/"],
  "skills": ["./skills/planning-exploratory-testing/"]
}
```

`<repo>/.github/plugin/marketplace.json`:

```json
{
  "name": "acme",
  "metadata": { "description": "Acme's agent plugins.", "version": "1.0.0" },
  "owner": { "name": "Acme QA" },
  "plugins": [
    { "name": "exploratory-testing", "source": "plugins/exploratory-testing", "description": "…", "version": "1.0.0" }
  ]
}
```

Install: `copilot plugin marketplace add acme/agent-plugins`, then `copilot plugin install exploratory-testing@acme`. In VS Code, plugins are browsed with `@agentPlugins` in the Extensions view or the `Chat: Plugins` command. MCP servers are not started from the plugin; document them for users to add.

## Claude Code

`<plugin>/.claude-plugin/plugin.json`:

```json
{
  "name": "exploratory-testing",
  "version": "1.0.0",
  "description": "Session-based exploratory testing: charters, heuristics, session notes and debriefs.",
  "author": { "name": "Acme QA", "url": "https://example.com" },
  "repository": "https://github.com/acme/agent-plugins",
  "license": "MIT",
  "keywords": ["exploratory-testing", "charters", "qa"]
}
```

Components sit in conventional folders at the plugin root: `skills/<name>/`, `agents/<name>.md`, `hooks/hooks.json`, `.mcp.json`. Scripts reference the plugin folder as `${CLAUDE_PLUGIN_ROOT}`. Claude Code scans `agents/` recursively, so keep other hosts' agent files outside it. Agents in a plugin ignore `hooks`, `mcpServers` and `permissionMode` frontmatter.

`<repo>/.claude-plugin/marketplace.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "acme",
  "owner": { "name": "Acme QA" },
  "metadata": { "description": "Acme's agent plugins.", "version": "1.0.0" },
  "plugins": [
    { "name": "exploratory-testing", "source": "./plugins/exploratory-testing", "description": "…", "version": "1.0.0" }
  ]
}
```

Install: `/plugin marketplace add acme/agent-plugins`, then `/plugin install exploratory-testing@acme`.

## OpenAI Codex

OpenAI's plugin-creator scaffolds `<plugin>/.codex-plugin/plugin.json`:

```json
{
  "name": "exploratory-testing",
  "version": "1.0.0",
  "description": "Session-based exploratory testing: charters, heuristics, session notes and debriefs.",
  "author": { "name": "Acme QA", "url": "https://example.com" },
  "repository": "https://github.com/acme/agent-plugins",
  "license": "MIT",
  "keywords": ["exploratory-testing", "charters", "qa"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "interface": {
    "displayName": "Exploratory Testing",
    "shortDescription": "Charters, heuristics and debriefs",
    "category": "Productivity"
  }
}
```

- `name` is kebab-case, max 64 characters, and equals the plugin folder name.
- Optional paths: `skills`, `hooks`, `mcpServers`, `apps`. Optional `interface` fields include `displayName`, `shortDescription`, `longDescription`, `developerName`, `category`, `defaultPrompt`, `brandColor`, icons and screenshots.
- This collection's build writes `plugin.json` at the plugin root with the Agent Plugins schema (`https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`) as its Codex manifest instead. Check which location your Codex version reads before copying either layout.

`<repo>/.agents/plugins/marketplace.json` (home-local: `~/.agents/plugins/marketplace.json`):

```json
{
  "name": "acme",
  "interface": { "displayName": "Acme Agent Plugins" },
  "plugins": [
    {
      "name": "exploratory-testing",
      "source": { "source": "local", "path": "./plugins/exploratory-testing" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    }
  ]
}
```

- Every entry needs `policy.installation` (`NOT_AVAILABLE`, `AVAILABLE`, `INSTALLED_BY_DEFAULT`), `policy.authentication` (`ON_INSTALL`, `ON_USE`) and `category`.
- Entry order is display order; append new entries.
- `displayName` belongs in the marketplace `interface`, not in entries.

Install: `codex plugin marketplace add acme/agent-plugins`, then `codex plugin add exploratory-testing@acme` (older Codex CLI releases used `codex marketplace add`). Start a new session so the skills are discovered. Codex does not load agents from plugins: ship TOML files and tell users to copy them into `.codex/agents/`.

## Keeping hand-written manifests honest

- One source per skill, copied into each plugin by a script; never edit the copy.
- The same `name`, `description` and `version` in every manifest and marketplace entry for a plugin. A script that writes all of them from one place prevents drift.
- Real files, not symlinks.
