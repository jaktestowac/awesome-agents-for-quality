# Plugin Packaging Checklist

## Before packaging

- [ ] Each skill passes the `creating-skills` checklist and has been used on a real task.
- [ ] The skills are stable enough that an edit is not a release every week.
- [ ] The bundle is one capability or a group used together; grouping by topic was rejected.
- [ ] No two skills in the bundle compete for the same requests.
- [ ] Every command's `agent:` target ships in the same plugin.

## This collection

- [ ] Only `bundles.yaml` and `src/` were edited; nothing under `plugins/`, `rules/`, `hooks/`, `catalog/`, the marketplace files or the README tables.
- [ ] Every skill, command and agent is in exactly one bundle.
- [ ] The bundle `description` says what is inside and when to install it.
- [ ] Any `guides:` entry names a file in `src/guides/` whose links resolve from the plugin's `guides/` folder.
- [ ] `npm run validate`, `npm run build` and `npm run check` pass, and the regenerated files are committed with the source change.

## A user's repository

- [ ] A manifest for each target host: `.github/plugin/plugin.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` (or the location your Codex version reads).
- [ ] A marketplace entry for each target host, with the same `name`, `description` and `version` as the manifest.
- [ ] Codex marketplace entries have `policy.installation`, `policy.authentication` and `category`.
- [ ] Copilot `skills` and `agents` paths are relative to the plugin root and resolve.
- [ ] Skill folders are real copies of one source, not symlinks and not hand-edited.
- [ ] Codex agents ship as TOML files with copy instructions; MCP servers for Copilot are documented for manual setup.
- [ ] The README lists every skill with its resources, every command and agent, install commands per host, and prerequisites.

## Install test

- [ ] Added the marketplace and installed the plugin in each target host.
- [ ] In a new session, one skill triggered on a matching request and one command ran by name.
- [ ] The plugin's skills are not also installed by hand (they would load twice).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `npm run check` reports files out of date | `src/` or `bundles.yaml` changed without a rebuild, or a generated file was edited | Edit the source, run `npm run build`, commit both |
| `npm run validate`: asset not in any bundle | New skill, command or agent not added to `bundles.yaml` | Add it to exactly one bundle |
| Command runs but the hand-off fails | The `agent:` target is in another plugin | Move the command or the agent so they share a bundle |
| Skill missing in Codex after install | Symlinked folder, or no new session | Use real files; start a new session |
| Agents missing in Codex | Codex does not load agents from plugins | Copy `codex/agents/*.toml` into `.codex/agents/` |
| MCP tools missing in Copilot | Copilot does not start MCP servers from the plugin | Add the server to the Copilot MCP configuration |
| A skill triggers twice or contradicts itself | Installed by hand and as a plugin | Keep one route |
