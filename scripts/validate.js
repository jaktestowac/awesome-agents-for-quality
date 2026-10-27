#!/usr/bin/env node

// Validates the source tree before it is built:
// - SKILL.md has name (matching the folder, Agent Skills naming rules) and description (<= 1024 chars)
// - SKILL.md uses only frontmatter keys that are copied unchanged to every host
// - agents have name (matching the file), description, known capabilities and known MCP servers
// - commands have a unique name, a known agent and MCP servers, and every {{placeholder}} declared as an input
// - rules have a description and a non-empty applyTo glob list
// - packs have pack.yaml, an orchestrator, titled agents and Copilot references that resolve within the pack
// - names are unique across skills, commands, agents, hooks and packs
// - hooks have hook.yaml, a valid hooks.json per host, and every Claude Code script they reference
// - MCP server files have a name matching the file and a command
// - every skill, command, agent and guide belongs to exactly one bundle, and every bundle entry exists
// - warns when a command hands off to an agent shipped in another bundle
// - warns when a SKILL.md exceeds 500 lines
// - warns when a skill body names a host, outside skills that are about hosts

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./lib/log');
const {
  rel,
  listFiles,
  listSkills,
  listAgents,
  listRules,
  listCommands,
  listGuides,
  listHooks,
  listPacks,
  listMcpServers,
  loadBundles,
} = require('./lib/collection');
const { CAPABILITIES, CONTEXT_PLACEHOLDERS } = require('./lib/hosts');

const log = createLogger('validate');
const errors = [];
const warnings = [];

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ALLOWED_SKILL_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
  'argument-hint',
  'user-invocable',
]);
const ALLOWED_AGENT_KEYS = new Set(['name', 'title', 'description', 'capabilities', 'mcp']);
const ALLOWED_COMMAND_KEYS = new Set(['name', 'title', 'description', 'agent', 'mcp', 'inputs']);
const ALLOWED_PACK_AGENT_KEYS = new Set([...ALLOWED_AGENT_KEYS, 'copilot']);
const ALLOWED_COPILOT_PACK_KEYS = new Set(['argument-hint', 'user-invocable', 'agents', 'handoffs', 'target', 'mcp-servers']);
// Skills and commands whose subject is the hosts themselves may name them.
const HOST_NAMES_ALLOWED = [/^creating-/, /^testing-agent-skills$/, /^create-skill$/, /^audit-collection-health$/];
const HOST_NAMES = /\b(GitHub Copilot|Copilot|Claude Code|Codex)\b/;

log.intro('checking src/ and bundles.yaml');

// skills
const skills = listSkills();
for (const skill of skills) {
  const where = rel(skill.file);
  if (!skill.exists) {
    errors.push(`${rel(skill.dir)}: missing SKILL.md`);
    continue;
  }
  const data = skill.data;
  if (!data) {
    errors.push(`${where}: ${skill.error}`);
    continue;
  }
  if (data.name !== skill.folder) {
    errors.push(`${where}: name '${data.name}' does not match folder '${skill.folder}'`);
  }
  if (!NAME_PATTERN.test(skill.folder) || skill.folder.length > 64) {
    errors.push(`${where}: name must be lowercase letters, digits and single hyphens, max 64 chars`);
  }
  if (typeof data.description !== 'string' || !data.description.trim()) {
    errors.push(`${where}: missing description`);
  } else if (data.description.length > 1024) {
    errors.push(`${where}: description is ${data.description.length} chars (max 1024)`);
  }
  for (const key of Object.keys(data)) {
    if (!ALLOWED_SKILL_KEYS.has(key)) {
      errors.push(`${where}: frontmatter key '${key}' is not copied to every host; see CONTRIBUTING.md`);
    }
  }
  if (skill.lineCount > 500) {
    warnings.push(`${where}: SKILL.md is ${skill.lineCount} lines (> 500) - move detail to resources/`);
  }
  if (!HOST_NAMES_ALLOWED.some((pattern) => pattern.test(skill.folder))) {
    for (const file of listFiles(skill.dir).filter((f) => f.endsWith('.md'))) {
      const lines = fs.readFileSync(path.join(skill.dir, file), 'utf8').split('\n');
      lines.forEach((line, i) => {
        const hit = line.match(HOST_NAMES);
        if (hit) warnings.push(`${rel(path.join(skill.dir, file))}:${i + 1}: names host '${hit[1]}'`);
      });
    }
  }
}

// MCP servers
const mcpServers = listMcpServers();
for (const server of mcpServers) {
  const where = rel(server.file);
  if (server.error) {
    errors.push(`${where}: ${server.error}`);
    continue;
  }
  if (server.data?.name !== server.slug) errors.push(`${where}: name must match the file name '${server.slug}'`);
  if (typeof server.data?.command !== 'string') errors.push(`${where}: missing command`);
  if (server.data?.args !== undefined && !Array.isArray(server.data.args)) errors.push(`${where}: args must be a list`);
}
const mcpNames = new Set(mcpServers.map((s) => s.slug));

// agents
function checkAgent(agent, allowedKeys) {
  const where = rel(agent.file);
  const data = agent.data;
  if (!data) {
    errors.push(`${where}: ${agent.error}`);
    return;
  }
  if (data.name !== agent.slug) errors.push(`${where}: name '${data.name}' does not match file name '${agent.slug}'`);
  if (!NAME_PATTERN.test(agent.slug)) errors.push(`${where}: name must be lowercase letters, digits and single hyphens`);
  if (typeof data.description !== 'string' || !data.description.trim()) errors.push(`${where}: missing description`);
  if (!Array.isArray(data.capabilities) || !data.capabilities.length) {
    errors.push(`${where}: capabilities must be a non-empty list`);
  } else {
    for (const cap of data.capabilities) {
      if (!CAPABILITIES[cap]) errors.push(`${where}: unknown capability '${cap}' (known: ${Object.keys(CAPABILITIES).join(', ')})`);
    }
  }
  for (const server of data.mcp || []) {
    if (!mcpNames.has(server)) errors.push(`${where}: mcp server '${server}' has no src/mcp/${server}.yaml`);
  }
  for (const key of Object.keys(data)) {
    if (!allowedKeys.has(key)) errors.push(`${where}: unknown frontmatter key '${key}'`);
  }
  if (!agent.body.trim()) errors.push(`${where}: no instructions after the frontmatter`);
}

const agents = listAgents();
for (const agent of agents) checkAgent(agent, ALLOWED_AGENT_KEYS);

// orchestration packs
const packs = listPacks();
for (const pack of packs) {
  const where = rel(pack.dir);
  const data = pack.data;
  if (!data) {
    errors.push(`${where}/pack.yaml: ${pack.error}`);
    continue;
  }
  if (data.name !== pack.slug) errors.push(`${where}/pack.yaml: name '${data.name}' does not match folder '${pack.slug}'`);
  if (!NAME_PATTERN.test(pack.slug)) errors.push(`${where}: name must be lowercase letters, digits and single hyphens`);
  for (const key of ['title', 'description', 'orchestrator']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) errors.push(`${where}/pack.yaml: missing ${key}`);
  }
  if (!pack.agents.length) errors.push(`${where}: no agents in agents/`);
  for (const agent of pack.agents) {
    checkAgent(agent, ALLOWED_PACK_AGENT_KEYS);
    for (const key of Object.keys(agent.data?.copilot || {})) {
      if (!ALLOWED_COPILOT_PACK_KEYS.has(key)) errors.push(`${rel(agent.file)}: unknown copilot key '${key}'`);
    }
  }
  if (data.orchestrator && !pack.agents.some((a) => a.slug === data.orchestrator)) {
    errors.push(`${where}/pack.yaml: orchestrator '${data.orchestrator}' is not in agents/`);
  }
  // Copilot wires a pack together by display name: every reference must name an agent in the same pack.
  const titles = new Map();
  for (const agent of pack.agents) {
    const title = agent.data?.title;
    if (!title) {
      errors.push(`${rel(agent.file)}: pack agents need a title, their Copilot name`);
    } else if (titles.has(title)) {
      errors.push(`${rel(agent.file)}: title '${title}' is also used by ${titles.get(title)}`);
    } else {
      titles.set(title, agent.slug);
    }
  }
  for (const agent of pack.agents) {
    const copilot = agent.data?.copilot || {};
    const refs = [...(copilot.handoffs || []).map((h) => h.agent), ...(copilot.agents || [])];
    for (const ref of refs) {
      if (ref !== '*' && !titles.has(ref)) errors.push(`${rel(agent.file)}: refers to agent '${ref}', which is not a title in this pack`);
    }
  }
}

// rules
const rules = listRules();
for (const rule of rules) {
  const where = rel(rule.file);
  const data = rule.data;
  if (!data) {
    errors.push(`${where}: ${rule.error}`);
    continue;
  }
  if (!NAME_PATTERN.test(rule.slug)) errors.push(`${where}: file name must be lowercase letters, digits and single hyphens`);
  if (typeof data.description !== 'string' || !data.description.trim()) errors.push(`${where}: missing description`);
  if (!Array.isArray(data.applyTo) || !data.applyTo.length || !data.applyTo.every((g) => typeof g === 'string' && g.trim())) {
    errors.push(`${where}: applyTo must be a non-empty list of globs`);
  } else if (data.applyTo.some((g) => g === '**' || g === '**/*')) {
    warnings.push(`${where}: applyTo matches every file - scope it to the files the rules are about`);
  }
  for (const key of Object.keys(data)) {
    if (key !== 'description' && key !== 'applyTo') errors.push(`${where}: unknown frontmatter key '${key}'`);
  }
  if (!rule.body.trim()) errors.push(`${where}: no rules after the frontmatter`);
}

// hooks
const HOOK_HOSTS = ['copilot', 'claude'];
const hooks = listHooks();
for (const hook of hooks) {
  const where = rel(hook.dir);
  const data = hook.data;
  if (!data) {
    errors.push(`${where}/hook.yaml: ${hook.error}`);
    continue;
  }
  if (data.name !== hook.slug) errors.push(`${where}/hook.yaml: name '${data.name}' does not match folder '${hook.slug}'`);
  if (!NAME_PATTERN.test(hook.slug)) errors.push(`${where}: name must be lowercase letters, digits and single hyphens`);
  if (typeof data.description !== 'string' || !data.description.trim()) errors.push(`${where}/hook.yaml: missing description`);
  if (!Array.isArray(data.hosts) || !data.hosts.length) {
    errors.push(`${where}/hook.yaml: hosts must list at least one of ${HOOK_HOSTS.join(', ')}`);
  }
  for (const host of data.hosts || []) {
    if (!HOOK_HOSTS.includes(host)) {
      errors.push(`${where}/hook.yaml: unsupported host '${host}' (supported: ${HOOK_HOSTS.join(', ')})`);
      continue;
    }
    const hooksJson = path.join(hook.dir, host, 'hooks.json');
    if (!fs.existsSync(hooksJson)) {
      errors.push(`${where}/${host}: missing hooks.json`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(hooksJson, 'utf8'));
    } catch (e) {
      errors.push(`${where}/${host}/hooks.json: invalid JSON (${e.message})`);
      continue;
    }
    // Claude Code runs plugin hooks from ${CLAUDE_PLUGIN_ROOT}/hooks/; every script named there must exist.
    if (host === 'claude') {
      const refs = JSON.stringify(parsed).match(/\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/[^"\s]+/g) || [];
      for (const ref of refs) {
        const name = ref.replace('${CLAUDE_PLUGIN_ROOT}/hooks/', '');
        if (!fs.existsSync(path.join(hook.dir, 'claude', name)) && !hook.shared.includes(name)) {
          errors.push(`${where}/claude/hooks.json: references ${name}, which is not in claude/ or the hook root`);
        }
      }
    }
  }
  for (const file of hook.shared.filter((f) => f.endsWith('.json'))) {
    try {
      JSON.parse(fs.readFileSync(path.join(hook.dir, file), 'utf8'));
    } catch (e) {
      errors.push(`${where}/${file}: invalid JSON (${e.message})`);
    }
  }
}

// commands
const commands = listCommands();
const skillNames = new Set(skills.map((s) => s.folder));
const agentNames = new Set(agents.map((a) => a.slug));
for (const command of commands) {
  const where = rel(command.file);
  const data = command.data;
  if (!data) {
    errors.push(`${where}: ${command.error}`);
    continue;
  }
  if (data.name !== command.slug) errors.push(`${where}: name '${data.name}' does not match file name '${command.slug}'`);
  if (!NAME_PATTERN.test(command.slug) || command.slug.length > 64) {
    errors.push(`${where}: name must be lowercase letters, digits and single hyphens, max 64 chars`);
  }
  // Commands are published as skills, so they share the skills' namespace.
  if (skillNames.has(command.slug) || agentNames.has(command.slug)) {
    errors.push(`${where}: name '${command.slug}' is already used by a skill or agent`);
  }
  if (typeof data.description !== 'string' || !data.description.trim()) {
    errors.push(`${where}: missing description`);
  } else if (data.description.length > 1024) {
    errors.push(`${where}: description is ${data.description.length} chars (max 1024)`);
  }
  if (data.agent !== undefined && !agentNames.has(data.agent)) errors.push(`${where}: unknown agent '${data.agent}'`);
  for (const server of data.mcp || []) {
    if (!mcpNames.has(server)) errors.push(`${where}: mcp server '${server}' has no src/mcp/${server}.yaml`);
  }
  for (const key of Object.keys(data)) {
    if (!ALLOWED_COMMAND_KEYS.has(key)) errors.push(`${where}: unknown frontmatter key '${key}'`);
  }
  const inputs = Object.keys(data.inputs || {});
  const used = new Set([...command.body.matchAll(/\{\{([A-Za-z]+)\}\}/g)].map((m) => m[1]));
  for (const name of used) {
    if (!inputs.includes(name) && !CONTEXT_PLACEHOLDERS[name]) {
      errors.push(`${where}: {{${name}}} is used but not declared under inputs`);
    }
  }
  for (const name of inputs.filter((n) => !used.has(n))) {
    warnings.push(`${where}: input '${name}' is declared but never used in the body`);
  }
  if (!HOST_NAMES_ALLOWED.some((pattern) => pattern.test(command.slug))) {
    command.body.split('\n').forEach((line, i) => {
      const hit = line.match(HOST_NAMES);
      if (hit) warnings.push(`${where}:${i + 1}: names host '${hit[1]}'`);
    });
  }
  if (!command.body.trim()) errors.push(`${where}: no instructions after the frontmatter`);
}

// bundles
const bundles = loadBundles();
const commandNames = new Set(commands.map((c) => c.slug));
const owner = new Map();
const agentOwner = new Map();
const commandOwner = new Map();
const guideOwner = new Map();
const guides = listGuides();
const guideNames = new Set(guides.map((g) => g.slug));
for (const guide of guides) {
  if (!NAME_PATTERN.test(guide.slug)) errors.push(`${rel(guide.file)}: file name must be lowercase letters, digits and single hyphens`);
  if (!guide.title) errors.push(`${rel(guide.file)}: needs a '# ' title on its first heading`);
}

for (const [bundle, spec] of Object.entries(bundles)) {
  if (!NAME_PATTERN.test(bundle)) {
    errors.push(`bundles.yaml: bundle name '${bundle}' must be lowercase kebab-case`);
  }
  if (!spec || typeof spec.description !== 'string' || !spec.description.trim()) {
    errors.push(`bundles.yaml: bundle '${bundle}' has no description`);
  }
  for (const name of spec?.skills || []) {
    if (!skillNames.has(name)) {
      errors.push(`bundles.yaml: bundle '${bundle}' lists unknown skill '${name}'`);
    } else if (owner.has(name)) {
      errors.push(`bundles.yaml: skill '${name}' is in both '${owner.get(name)}' and '${bundle}'`);
    } else {
      owner.set(name, bundle);
    }
  }
  for (const name of spec?.agents || []) {
    if (!agentNames.has(name)) {
      errors.push(`bundles.yaml: bundle '${bundle}' lists unknown agent '${name}'`);
    } else if (agentOwner.has(name)) {
      errors.push(`bundles.yaml: agent '${name}' is in both '${agentOwner.get(name)}' and '${bundle}'`);
    } else {
      agentOwner.set(name, bundle);
    }
  }
  for (const name of spec?.commands || []) {
    if (!commandNames.has(name)) {
      errors.push(`bundles.yaml: bundle '${bundle}' lists unknown command '${name}'`);
    } else if (commandOwner.has(name)) {
      errors.push(`bundles.yaml: command '${name}' is in both '${commandOwner.get(name)}' and '${bundle}'`);
    } else {
      commandOwner.set(name, bundle);
    }
  }
  for (const name of spec?.guides || []) {
    if (!guideNames.has(name)) {
      errors.push(`bundles.yaml: bundle '${bundle}' lists unknown guide '${name}'`);
    } else if (guideOwner.has(name)) {
      errors.push(`bundles.yaml: guide '${name}' is in both '${guideOwner.get(name)}' and '${bundle}'`);
    } else {
      guideOwner.set(name, bundle);
    }
  }
  for (const server of spec?.mcp || []) {
    if (!mcpNames.has(server)) errors.push(`bundles.yaml: bundle '${bundle}' lists unknown mcp server '${server}'`);
  }
}

// A command that hands off to an agent should ship in the same plugin as that agent.
for (const command of commands) {
  const agent = command.data?.agent;
  const bundle = commandOwner.get(command.slug);
  if (agent && bundle && agentOwner.get(agent) && agentOwner.get(agent) !== bundle) {
    warnings.push(
      `bundles.yaml: command '${command.slug}' (in '${bundle}') hands off to agent '${agent}' (in '${agentOwner.get(agent)}')`,
    );
  }
}

for (const name of skills.map((s) => s.folder).filter((n) => !owner.has(n))) {
  errors.push(`src/skills/${name}: not in any bundle in bundles.yaml`);
}
for (const name of agents.map((a) => a.slug).filter((n) => !agentOwner.has(n))) {
  errors.push(`src/agents/${name}.md: not in any bundle in bundles.yaml`);
}
for (const name of guides.map((g) => g.slug).filter((n) => !guideOwner.has(n))) {
  errors.push(`src/guides/${name}.md: not in any bundle in bundles.yaml`);
}
for (const name of commands.map((c) => c.slug).filter((n) => !commandOwner.has(n))) {
  errors.push(`src/commands/${name}.md: not in any bundle in bundles.yaml`);
}
// Each hook and pack is published as its own plugin, so it can't share a name with a bundle.
for (const hook of hooks.filter((h) => bundles[h.slug])) {
  errors.push(`src/hooks/${hook.slug}: name is already used by a bundle in bundles.yaml`);
}
// A pack's name is also its plugin and its orchestrator command; its agents share one namespace with all
// other agents, because Codex keeps every agent in a single .codex/agents/ folder.
const taken = new Map();
function claim(name, owner) {
  if (taken.has(name)) errors.push(`${owner}: name '${name}' is already used by ${taken.get(name)}`);
  else taken.set(name, owner);
}
for (const name of skillNames) claim(name, `skill ${name}`);
for (const name of commandNames) claim(name, `command ${name}`);
for (const name of agentNames) claim(name, `agent ${name}`);
for (const hook of hooks) claim(hook.slug, `hook ${hook.slug}`);
for (const pack of packs) {
  if (bundles[pack.slug]) errors.push(`src/packs/${pack.slug}: name is already used by a bundle in bundles.yaml`);
  claim(pack.slug, `pack ${pack.slug}`);
  for (const agent of pack.agents) claim(agent.slug, `agent ${agent.slug} in pack ${pack.slug}`);
}

log.finish({
  errors,
  warnings,
  ok: `(${skills.length} skills, ${commands.length} commands, ${agents.length} agents, ${rules.length} rules, ${hooks.length} hooks, ${packs.length} packs, ${guides.length} guides, ${mcpServers.length} MCP servers, ${Object.keys(bundles).length} bundles)`,
  next: ['npm run build'],
});
