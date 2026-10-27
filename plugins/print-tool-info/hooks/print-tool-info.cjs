#!/usr/bin/env node
// Shows which tool Claude Code is about to run, with its arguments, before each tool call.
// The message goes to you through systemMessage; Claude does not see it. Never blocks: exits 0.

const fs = require('fs');

let payload = {};
try {
  payload = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const args = JSON.stringify(payload.tool_input ?? {});
const message = [
  `🔧 ${payload.tool_name || 'unknown tool'}`,
  `Time: ${new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')}`,
  `Working directory: ${payload.cwd || process.cwd()}`,
  `Arguments: ${args.length > 500 ? `${args.slice(0, 500)}…` : args}`,
].join('\n');

process.stdout.write(JSON.stringify({ systemMessage: message }));
process.exit(0);
