// Reads the source tree: bundles.yaml, src/skills/*/SKILL.md, src/agents/*.md, src/commands/*.md,
// src/rules/*.md, src/guides/*.md, src/hooks/*/, src/packs/*/ and src/mcp/*.yaml.
// Shared by validate.js and build.js so both see the collection the same way.

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const repoRoot = path.join(__dirname, '..', '..');
const skillsRoot = path.join(repoRoot, 'src', 'skills');
const agentsRoot = path.join(repoRoot, 'src', 'agents');
const mcpRoot = path.join(repoRoot, 'src', 'mcp');
const rulesRoot = path.join(repoRoot, 'src', 'rules');
const commandsRoot = path.join(repoRoot, 'src', 'commands');
const hooksRoot = path.join(repoRoot, 'src', 'hooks');
const packsRoot = path.join(repoRoot, 'src', 'packs');
const guidesRoot = path.join(repoRoot, 'src', 'guides');

function rel(p) {
  return path.relative(repoRoot, p).split(path.sep).join('/');
}

// Invalid YAML yields data: null plus an error message, so the validator can report it instead of crashing.
function parseYaml(text) {
  try {
    return { data: YAML.parse(text), error: null };
  } catch (e) {
    return { data: null, error: `invalid YAML: ${e.message.split('\n')[0]}` };
  }
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const parsed = m ? parseYaml(m[1]) : { data: null, error: 'missing frontmatter block' };
  return {
    ...parsed,
    body: m ? content.slice(m[0].length).replace(/^\r?\n+/, '') : content,
    lineCount: content.split('\n').length,
  };
}

function readYamlFile(filePath) {
  return fs.existsSync(filePath) ? parseYaml(fs.readFileSync(filePath, 'utf8')) : { data: null, error: 'file missing' };
}

// Every file under dir, as forward-slash paths relative to dir.
function listFiles(dir) {
  const out = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  }
  if (fs.existsSync(dir)) walk(dir);
  return out.sort();
}

function listSkills() {
  if (!fs.existsSync(skillsRoot)) return [];
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(skillsRoot, entry.name);
      const file = path.join(dir, 'SKILL.md');
      const exists = fs.existsSync(file);
      return {
        folder: entry.name,
        dir,
        file,
        exists,
        ...(exists ? readFrontmatter(file) : { data: null, lineCount: 0 }),
      };
    })
    .sort((a, b) => a.folder.localeCompare(b.folder));
}

// Markdown files with frontmatter, one per item, named after the item.
function listMarkdown(root) {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const full = path.join(root, file);
      return { file: full, slug: file.replace(/\.md$/, ''), ...readFrontmatter(full) };
    });
}

function listAgents() {
  return listMarkdown(agentsRoot);
}

function listRules() {
  return listMarkdown(rulesRoot);
}

function listCommands() {
  return listMarkdown(commandsRoot);
}

// Guides are plain Markdown walkthroughs; the title is the first `# ` heading and the summary the
// first paragraph after it.
function listGuides() {
  if (!fs.existsSync(guidesRoot)) return [];
  return fs
    .readdirSync(guidesRoot)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const full = path.join(guidesRoot, file);
      const text = fs.readFileSync(full, 'utf8');
      const summary = text
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .find((block) => block.trim() && !block.startsWith('#'));
      return {
        file: full,
        slug: file.replace(/\.md$/, ''),
        title: (text.match(/^# (.+)$/m) || [])[1] || null,
        summary: summary ? summary.replace(/\s+/g, ' ').trim() : '',
      };
    });
}

// Orchestration packs: pack.yaml, an agents/ folder of cooperating agents and an optional GUIDE.md.
function listPacks() {
  if (!fs.existsSync(packsRoot)) return [];
  return fs
    .readdirSync(packsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(packsRoot, entry.name);
      const meta = path.join(dir, 'pack.yaml');
      return {
        slug: entry.name,
        dir,
        file: meta,
        ...readYamlFile(meta),
        agents: listMarkdown(path.join(dir, 'agents')),
        guide: fs.existsSync(path.join(dir, 'GUIDE.md')) ? path.join(dir, 'GUIDE.md') : null,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// Hooks differ too much between hosts to share one implementation: each hook folder holds hook.yaml,
// one subfolder per host with that host's files, and any shared files (such as a config) at its root.
function listHooks() {
  if (!fs.existsSync(hooksRoot)) return [];
  return fs
    .readdirSync(hooksRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(hooksRoot, entry.name);
      const meta = path.join(dir, 'hook.yaml');
      return {
        slug: entry.name,
        dir,
        file: meta,
        ...readYamlFile(meta),
        shared: fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((f) => f.isFile() && f.name !== 'hook.yaml')
          .map((f) => f.name)
          .sort(),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function listMcpServers() {
  if (!fs.existsSync(mcpRoot)) return [];
  return fs
    .readdirSync(mcpRoot)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => {
      const full = path.join(mcpRoot, file);
      return { file: full, slug: file.replace(/\.yaml$/, ''), ...readYamlFile(full) };
    });
}

function loadBundles() {
  const { data, error } = readYamlFile(path.join(repoRoot, 'bundles.yaml'));
  if (error) throw new Error(`bundles.yaml: ${error}`);
  return data || {};
}

function loadPackage() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
}

module.exports = {
  repoRoot,
  skillsRoot,
  rel,
  readFrontmatter,
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
  loadPackage,
};
