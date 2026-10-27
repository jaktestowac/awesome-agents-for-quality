---
name: explain-code
description: "Explains the selected code, the active file, or a pasted snippet: purpose, control flow, patterns, risks, and what a tester should verify, adapted to a developer, tester, or non-technical audience. Use when you need to understand unfamiliar code before testing or reviewing it. To turn the code into a table of test cases with coverage status, use the derive-test-cases-from-code command."
argument-hint: "[audience]"
disable-model-invocation: true
---

# Analyze and explain code

## Inputs

Take these from what the user typed after the command, or from the conversation. Ask for any you need that are missing.

- `audience`: developer, tester, or non-technical (default: tester)

# Task

Analyze and explain the target code. Priority order for the target:

1. The current selection: the code the user selected or pasted
2. The active file: the file the user is working on
3. Code pasted or referenced in the request.

If none of these yields a target, **pause and ask me to pick one**: specific file, selection, PR, diff, folder, or paste a snippet. Then continue.

Optional: adapt the depth and vocabulary to the audience `<audience>`.

# Methodology

Use the read and search tools to understand the code, its context, and its callers before explaining. Do not explain code in isolation when its behavior depends on surrounding modules.

Then provide an explanation covering:

- **Purpose** - what it does and why it exists
- **How it works** - control flow, key data, and important state transitions
- **Key components** - main functions, classes, or blocks and their roles
- **Patterns and practices** - notable patterns, idioms, or anti-patterns
- **Testing perspective** - inputs and edge cases, error paths, side effects, external dependencies, and the behaviors most worth testing
- **Risks and improvements** - potential bugs, unclear contracts, and concrete suggestions

# Output format

- Use clear headings for the sections above and bullet points for clarity.
- Include minimal, focused code snippets when suggesting changes.
- Prefer concise bullets over long prose.
- If the analysis spans multiple files, list the impacted files and why.
- End with a short **What to test first** list when the testing perspective surfaced risks.

# Critical

- Do not output the code itself unless it's a minimal snippet for illustration.
- This is a read-only analysis: never create, edit, or delete files, and never run commands.
- If behavior cannot be determined from the code alone, say so explicitly instead of guessing.
