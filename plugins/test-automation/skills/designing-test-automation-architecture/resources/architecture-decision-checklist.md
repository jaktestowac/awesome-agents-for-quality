# Architecture Decision Checklist

Use the record format in `documenting-test-suites` (`test-adr-template.md`): context, decision, alternatives with why each was rejected, consequences, and a revisit condition. This file lists which decisions usually deserve a record and what each record must answer.

## Decisions and their questions

| Decision | The record must answer |
| --- | --- |
| **Layer placement policy** | Which kinds of behaviour go to unit, component, API, contract, and E2E? What is the rule for pushing a test down? Who reviews placement? |
| **Runner per layer** | Which runner for unit, component, API, and E2E? Why one runner or several? |
| **Reuse pattern** | Fixtures, page objects, helpers, screenplay: which are used, the promotion rule, and what each may contain (assertions in page objects or not)? |
| **Auth strategy** | How sessions are created (setup project, API login), how many roles, where `storageState` lives, per-worker accounts or shared? |
| **Test data strategy** | Created per test or seeded? How unique values are generated? Who cleans up and how? What shared data is read-only? |
| **Mocking boundary** | What stays real at each layer, what is stubbed, and how stubs are guarded against drift? |
| **Environment strategy** | Which environments, how the target is chosen, which tests may run where, how credentials are supplied? |
| **Folder and naming layout** | Where each layer lives, file naming, where shared code lives, monorepo package boundaries? |
| **Tag taxonomy** | Which tags exist, what each means, which job selects each? |
| **Ownership** | Who owns the suite, each area, and shared code? How failures are routed? |
| **Browser and device coverage** | Which projects run on PR, main, nightly, and why? |

## Questions to ask before accepting a decision

- Does it allow `fullyParallel: true` with several workers, without shared mutable state?
- Can a developer who writes tests once a month follow it without reading a framework guide?
- Is there one way to do it, or does it leave two acceptable patterns?
- What would make it wrong? (That becomes the "revisit when" line.)
- Has it been tried on one real journey (the thin slice)?

## Example decision titles

Illustrative, to show the grain of a decision:

- `0001. E2E tests cover journeys only; rules and permissions are tested at the API layer`
- `0002. Fixtures for lifecycle, page objects for pages with 5+ reused interactions, no base page class`
- `0003. One storageState per role via a setup project; per-worker accounts for tests that change account settings`
- `0004. Test data created through the API per test and deleted in fixture teardown`
- `0005. BASE_URL selects the environment; production runs only @prod-safe tests`

One decision per record. A record titled "Test architecture" that covers everything is never updated, because changing one part means rewriting all of it.
