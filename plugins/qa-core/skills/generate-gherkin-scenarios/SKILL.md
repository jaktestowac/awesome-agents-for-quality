---
name: generate-gherkin-scenarios
description: Converts a user story, acceptance criteria, or feature description into a declarative Gherkin .feature file (Given/When/Then) with scenario outlines for data variations, ready for Cucumber or Playwright-BDD. Use when a team writes BDD specs or wants acceptance criteria as living documentation. For a focused list of edge-case scenarios around states and boundaries, use the edge-case-scenario-generator command.
argument-hint: "[requirements]"
disable-model-invocation: true
---

# Generate Gherkin scenarios

## Inputs

Take these from what the user typed after the command, or from the conversation. Ask for any you need that are missing.

- `requirements`: user story, acceptance criteria, feature description, or a file path

## Who does the work

Hand this task to the `test-planner` agent (`test_planner` in Codex). If that agent is not installed, do the task yourself, following the steps below.

# Task

Your goal is to produce Gherkin scenarios that read as living documentation, not a UI click script in disguise.

Convert the requirements provided: <requirements>

Ask only for missing essentials:

- the requirements, if not provided
- domain vocabulary the team already uses, if a glossary or existing feature files exist in the workspace (search for `*.feature` files first)
- explicit out-of-scope behavior

Then do the following:

1. Extract the behaviors: each distinct rule or outcome becomes its own scenario. Do not bundle unrelated outcomes into one scenario.
2. Write scenarios following Gherkin best practices:
   - declarative, business-language steps ("Given the user has an expired subscription"), not UI mechanics ("When I click the red button")
   - one When per scenario - a single action or event under test
   - concrete example values rather than abstract placeholders
   - `Scenario Outline` with an `Examples` table when the same rule varies only by data
   - `Background` only for setup shared by every scenario in the feature
3. Cover the rule from all sides: happy path, negative cases, boundary values, and permission variants that the requirements imply.
4. Reuse step phrasing consistently so steps can map to shared step definitions.
5. List the requirement statements that could not be expressed as scenarios and why - these go back to the product owner or to the `review-requirements` command.

## Output format

Return a complete `.feature` file in a Gherkin code block, with feature-level description and tags (e.g. `@smoke`, `@regression`) on scenarios.
After the feature file, add a short section with open questions and untestable statements.
Do not create or edit files unless I explicitly ask you to save the feature file.
