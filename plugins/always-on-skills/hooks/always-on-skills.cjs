#!/usr/bin/env node
// Keeps always-apply skill invariants in force across a Claude Code session.
//
//   session    print the invariant block to stdout; Claude Code adds SessionStart stdout to the context
//   post-tool  after an edit to a file in a path-scoped skill's scope, restate that skill's invariant
//              to Claude through hookSpecificOutput.additionalContext, and log the edit
//
// Config: .claude/always-on-skills.json in the project when present, otherwise the copy bundled with
// the plugin. Same format as the Copilot hook's always-on-skills.json.
//
// Never blocks: every path exits 0.

const fs = require('fs');
const path = require('path');

const MODE = process.argv[2] || 'session';
const LOG_PATH = '.claude/logs/always-on-skills.log';

function warn(message) {
  process.stderr.write(`always-on-skills: ${message}\n`);
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function loadConfig(projectDir) {
  const candidates = [
    path.join(projectDir, '.claude', 'always-on-skills.json'),
    path.join(__dirname, 'always-on-skills.json'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const config = parse(fs.readFileSync(file, 'utf8'));
    if (!config) warn(`${file} is not valid JSON - skipping.`);
    return config;
  }
  warn('no always-on-skills.json found - skipping.');
  return null;
}

// Shell-style glob where `*` crosses directory separators, matching the Copilot hook.
function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, process.platform === 'win32' ? 'i' : '');
}

function invariantBlock(skills) {
  const lines = ['These skills apply to every response in this workspace. They do not lapse when the topic changes.', ''];
  for (const skill of skills) lines.push(`## ${skill.name}`, '', skill.invariant, '');
  lines.push(
    'If one of these conflicts with a task instruction, the task wins and the invariant still applies to how the result is reported.',
  );
  return lines.join('\n');
}

function relativePath(file, projectDir) {
  const normalized = file.replace(/\\/g, '/');
  const root = projectDir.replace(/\\/g, '/').replace(/\/$/, '');
  const prefix = `${root}/`;
  const sameRoot = process.platform === 'win32' ? normalized.toLowerCase().startsWith(prefix.toLowerCase()) : normalized.startsWith(prefix);
  return (sameRoot ? normalized.slice(prefix.length) : normalized).replace(/^\/+/, '');
}

const payload = parse(readStdin()) || {};
const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
const config = loadConfig(projectDir);
if (!config) process.exit(0);
const enabled = (config.skills || []).filter((skill) => skill.enabled !== false && skill.name && skill.invariant);

if (MODE === 'session') {
  if (!enabled.length) {
    warn('no skills enabled - nothing armed.');
    process.exit(0);
  }
  process.stdout.write(`# Always-Apply Skills\n\n${invariantBlock(enabled)}\n`);
  process.exit(0);
}

if (MODE === 'post-tool') {
  const file = payload.tool_input?.file_path || payload.tool_input?.notebook_path;
  if (!file) process.exit(0);
  const rel = relativePath(file, projectDir);

  const reminders = [];
  for (const skill of enabled) {
    const patterns = skill.appliesTo && skill.appliesTo.length ? skill.appliesTo : ['*'];
    // A skill scoped to everything is already in the context from session start.
    // Per-edit reminders are for path-scoped skills only, or every edit gets every invariant.
    if (patterns.length === 1 && patterns[0].trim() === '*') continue;
    if (patterns.some((pattern) => globToRegExp(pattern).test(rel))) {
      reminders.push(`${rel} is in scope of '${skill.name}': ${skill.invariant}`);
    }
  }
  if (!reminders.length) process.exit(0);

  try {
    const log = path.join(projectDir, LOG_PATH);
    fs.mkdirSync(path.dirname(log), { recursive: true });
    fs.appendFileSync(log, `${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}\t${payload.tool_name || ''}\t${rel}\n`);
  } catch {
    // Logging is an audit aid; never fail the hook over it.
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: reminders.join('\n') },
    }),
  );
  process.exit(0);
}

warn(`unknown mode '${MODE}' (expected session or post-tool).`);
process.exit(0);
