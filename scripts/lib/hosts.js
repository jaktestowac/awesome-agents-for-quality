// Per-host rendering of agents, commands, rules and MCP servers. Skills need no rendering: every host reads
// SKILL.md as is.
//
// An agent's `capabilities` are host-neutral. Each host gets them translated to its own tool names:
//
//   capability   Copilot      Claude Code                                         Codex
//   read         read         Read                                                always on
//   search       search       Grep, Glob                                          always on
//   edit         edit         Edit, Write                                         no switch; told not to edit when absent
//   execute      execute      Bash, PowerShell                                    features.shell_tool = false when absent
//   web          web          WebFetch, WebSearch                                 inherited
//   agent        agent        Agent                                               inherited
//   todo         todo         TaskCreate, TaskGet, TaskList, TaskUpdate, TodoWrite inherited
//   ide          vscode       -                                                   -
//
// Claude Code agents also get `Skill`, because agents hand work to skills by name.

const YAML = require('yaml');

const CAPABILITIES = {
  read: { copilot: ['read'], claude: ['Read'] },
  search: { copilot: ['search'], claude: ['Grep', 'Glob'] },
  edit: { copilot: ['edit'], claude: ['Edit', 'Write'] },
  execute: { copilot: ['execute'], claude: ['Bash', 'PowerShell'] },
  web: { copilot: ['web'], claude: ['WebFetch', 'WebSearch'] },
  agent: { copilot: ['agent'], claude: ['Agent'] },
  todo: { copilot: ['todo'], claude: ['TaskCreate', 'TaskGet', 'TaskList', 'TaskUpdate', 'TodoWrite'] },
  ide: { copilot: ['vscode'], claude: [] },
};

function frontmatter(fields, body) {
  return `---\n${YAML.stringify(fields, { lineWidth: 0 })}---\n\n${body}`;
}

// Pack agents keep their display name as the Copilot name, because their `handoffs` and `agents`
// fields refer to each other by it, and carry those Copilot-only fields through unchanged.
function copilotAgent({ data, body }, { nameFromTitle = false } = {}) {
  const tools = [
    ...data.capabilities.flatMap((cap) => CAPABILITIES[cap].copilot),
    ...(data.mcp || []).map((server) => `${server}/*`),
  ];
  const fields = { name: nameFromTitle && data.title ? data.title : data.name };
  if (data.title && !nameFromTitle) fields.title = data.title;
  fields.description = data.description;
  fields.tools = tools;
  Object.assign(fields, data.copilot || {});
  return frontmatter(fields, body);
}

function claudeAgent({ data, body }) {
  const tools = [
    ...data.capabilities.flatMap((cap) => CAPABILITIES[cap].claude),
    'Skill',
    ...(data.mcp || []).map((server) => `mcp__${server}__*`),
  ];
  return frontmatter({ name: data.name, description: data.description, tools: tools.join(', ') }, body);
}

function codexAgentName(name) {
  return name.replace(/-/g, '_');
}

function tomlMultiline(text) {
  return text.includes("'''") ? JSON.stringify(text) : `'''\n${text}'''`;
}

function codexAgent({ data, body }) {
  let instructions = body.endsWith('\n') ? body : `${body}\n`;
  if (!data.capabilities.includes('edit')) {
    instructions += '\nDo not create, modify or delete files. Report what should change instead.\n';
  }
  const lines = [
    `name = ${JSON.stringify(codexAgentName(data.name))}`,
    `description = ${JSON.stringify(data.description)}`,
    `developer_instructions = ${tomlMultiline(instructions)}`,
  ];
  if (!data.capabilities.includes('execute')) lines.push('', '[features]', 'shell_tool = false');
  return `${lines.join('\n')}\n`;
}

// Commands: prompts the user runs on purpose. Every host runs a skill as a slash command (`$name` in Codex),
// so a command becomes one skill folder that all three read, with model invocation turned off so it never
// competes with the real skills. Inputs come from the user's message instead of Copilot's ${input:...} boxes.

const CONTEXT_PLACEHOLDERS = {
  selection: 'the code the user selected or pasted',
  file: 'the file the user is working on',
};

function commandSkill({ data, body }) {
  const inputs = data.inputs || {};
  const names = Object.keys(inputs);
  const fields = { name: data.name, description: data.description };
  if (names.length) fields['argument-hint'] = names.map((n) => `[${n}]`).join(' ');
  fields['disable-model-invocation'] = true;

  const out = [`# ${data.title || data.name}`, ''];
  if (names.length) {
    out.push(
      '## Inputs',
      '',
      'Take these from what the user typed after the command, or from the conversation. Ask for any you need that are missing.',
      '',
      ...names.map((n) => `- \`${n}\`${inputs[n] ? `: ${inputs[n]}` : ''}`),
      '',
    );
  }
  if (data.agent) {
    out.push(
      '## Who does the work',
      '',
      `Hand this task to the \`${data.agent}\` agent (\`${codexAgentName(data.agent)}\` in Codex). If that agent is not installed, do the task yourself, following the steps below.`,
      '',
    );
  }
  const text = body.replace(/\{\{([A-Za-z]+)\}\}/g, (_, n) => CONTEXT_PLACEHOLDERS[n] || `<${n}>`);
  return frontmatter(fields, `${out.join('\n')}\n${text}`);
}

// Orchestration packs in Claude Code and Codex. A subagent can't start other subagents, so the
// orchestrator can't be one: it becomes a command that runs in the main conversation and delegates
// to the pack's agents. The instructions name agents by their Copilot display names, so the command
// starts with a table that maps each one to the name to call.
function orchestratorSkill(pack, orchestrator, helpers) {
  const fields = {
    name: pack.slug,
    description: `${pack.data.description} Runs the ${pack.data.title} orchestration pack: you coordinate, the pack's agents do the work.`,
    'disable-model-invocation': true,
  };
  const rows = helpers.map(
    ({ data }) => `| ${data.title || data.name} | \`${pack.slug}:${data.name}\` | \`${codexAgentName(data.name)}\` |`,
  );
  const out = [
    `# ${pack.data.title}`,
    '',
    '## How to run this pack',
    '',
    'You are the orchestrator, working in this conversation. Do the coordinating yourself and hand every step to one of the agents below:',
    '',
    '- In Claude Code, start the agent with your agent tool, using the name in the Claude Code column.',
    '- In Codex, spawn the agent by the name in the Codex column. The user must have copied the pack\'s `codex/agents/` files into `.codex/agents/`.',
    '',
    'The agents cannot call each other. Wherever the instructions below say an agent hands off to another, the result comes back to you and you pass it on. If an agent is not available, do its step yourself and say so in your summary.',
    '',
    '| Name used below | Claude Code | Codex |',
    '| --- | --- | --- |',
    ...rows,
    '',
    '---',
    '',
  ];
  return frontmatter(fields, `${out.join('\n')}\n${orchestrator.body}`);
}

// Codex: keep commands out of implicit invocation, the same as disable-model-invocation elsewhere.
function commandOpenAiYaml({ data }) {
  return YAML.stringify(
    {
      interface: { display_name: data.title || data.name },
      policy: { allow_implicit_invocation: false },
    },
    { lineWidth: 0 },
  );
}

// Rules: scoped guidance that applies while matching files are edited.
// Copilot and Claude Code scope by glob natively. Codex has no glob-scoped rules, so an AGENTS.md index
// tells the agent which rule file to read before touching which files.

function copilotRule({ data, body }) {
  return frontmatter({ description: data.description, applyTo: data.applyTo.join(',') }, body);
}

function claudeRule({ data, body }) {
  return frontmatter({ paths: data.applyTo }, body);
}

function codexRulesIndex(rules, rulesDir) {
  const rows = rules.map(
    ({ slug, data }) =>
      `| ${data.applyTo.map((glob) => `\`${glob}\``).join('<br>')} | [${slug}](${rulesDir}/${slug}.md) | ${data.description.replace(/\|/g, '\\|')} |`,
  );
  return [
    '## Quality rules',
    '',
    'Before you create or edit a file that matches a pattern below, read the linked rule file and follow it.',
    'Read a rule file only when a matching file is in scope.',
    '',
    '| Files | Rule | What it covers |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

// Claude Code reads .mcp.json, Codex reads mcp.json, both in the plugin root and in the same shape.
function mcpConfig(servers) {
  const mcpServers = {};
  for (const server of servers) mcpServers[server.name] = { command: server.command, args: server.args || [] };
  return `${JSON.stringify({ mcpServers }, null, 2)}\n`;
}

module.exports = {
  CAPABILITIES,
  copilotAgent,
  claudeAgent,
  codexAgent,
  codexAgentName,
  commandSkill,
  commandOpenAiYaml,
  orchestratorSkill,
  CONTEXT_PLACEHOLDERS,
  copilotRule,
  claudeRule,
  codexRulesIndex,
  mcpConfig,
};
