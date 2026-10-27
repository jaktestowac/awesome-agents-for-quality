# Structure, Config, and Tags

## Folder layout: single application

```text
tests/
├── e2e/
│   ├── auth.setup.ts            # setup project: logs in once per role, writes .auth/<role>.json
│   ├── checkout/
│   │   ├── discount.spec.ts
│   │   └── payment.spec.ts
│   └── account/
│       └── profile.spec.ts
├── api/
│   └── orders.spec.ts
├── components/                  # if Playwright component testing is used
├── visual/
│   └── theme.spec.ts
├── fixtures.ts                  # the suite's `test` and `expect`
├── pages/                       # page and component objects
├── data/                        # builders and API seeding helpers
└── README.md
.auth/                           # gitignored
playwright.config.ts
```

Unit and component tests often live next to the source (`src/cart/total.test.ts`) and run in a different runner. Record that choice; mixing both conventions for one layer is the problem.

Organise E2E and API tests by feature or journey, not by page. A folder per feature lines up with ownership and with path-filtered CI jobs.

## Folder layout: monorepo

```text
apps/
├── web/
│   └── tests/                   # app-level E2E and API tests, owned by the web team
└── admin/
    └── tests/
packages/
├── ui/                          # component tests next to the components
└── test-kit/                    # shared fixtures, builders, page objects used by several apps
```

A shared `test-kit` package earns its place when two or more apps reuse the same fixtures. Before that, duplication is cheaper than a shared package with two consumers and no owner.

## Config skeleton

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium-user',
      testDir: './tests/e2e',
      testIgnore: /admin\//,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-admin',
      testDir: './tests/e2e/admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
    },
    { name: 'api', testDir: './tests/api' },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run start', url: baseURL, reuseExistingServer: !process.env.CI },
});
```

Decisions this encodes, each worth stating in the README:

- `baseURL` comes from the environment; tests call `page.goto('/checkout')`, never a full host
- when `BASE_URL` points at a deployed environment, no local server starts
- auth happens once per role in a setup project; role is chosen by project, not by test code
- logged-out tests opt out with `test.use({ storageState: { cookies: [], origins: [] } })`
- retries are CI-only; trace on first retry

## Environments

| Concern | Decision to make |
| --- | --- |
| Which environments the suite runs against | local, ephemeral per PR, shared staging, production smoke |
| How the target is chosen | `BASE_URL` and related env vars; one config, no per-environment config copies |
| Credentials | CI secret store per environment; local `.env` gitignored with a committed `.env.example` |
| Data per environment | what can be created and deleted freely; what is shared reference data that tests must not mutate |
| Which tests may run in production | an explicit tag (for example `@prod-safe`) and read-only behaviour |

## Tag taxonomy

Keep it small. Each tag answers one question.

| Tag | Question it answers | Selected by |
| --- | --- | --- |
| `@smoke` | does it belong in the fast PR job? | PR CI job |
| `@slow` | should it be excluded from fast runs? | main and nightly jobs |
| `@quarantine` | is it currently non-blocking because it is flaky? | non-blocking job |
| `@visual` | does it compare screenshots and need the baseline container? | visual job |
| `@prod-safe` | may it run against production? | production smoke job |

Rules:

- use the `tag` option (`test('...', { tag: '@smoke' }, ...)`), not tags embedded in titles
- no tags that restate the folder (`@checkout` for tests in `tests/e2e/checkout/`)
- a tag with no job selecting it is either dead or a missing job
- tag meanings and owners are written in the tag glossary (`documenting-test-suites`)

## Ownership

- a CODEOWNERS entry per test folder, matching the owners of the code it covers, so review and failure routing reach someone
- a named owner for shared code (`fixtures.ts`, `pages/`, `test-kit/`); shared code without an owner accumulates every team's workaround
- optionally, an `owner` annotation on tests where folder ownership is not precise enough
