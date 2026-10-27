# Reuse Patterns

Fixtures, page objects, helpers, and screenplay solve different problems. Most Playwright suites use the first three together; screenplay is a deliberate opt-in.

## Selection rules

| Code that... | Goes into | Rule of thumb |
| --- | --- | --- |
| needs setup and teardown (auth state, created data, API clients, temp files) | **fixture** | always a fixture; teardown after `use()` runs even when the test fails |
| interacts with a page or component in many ways and is reused across files | **page object** (often provided by a fixture) | promote when a page has roughly 5+ interactions used in 3+ files |
| is stateless (build data, format a value, build a URL) | **helper** | plain function; no browser, no side effects |
| models several actors doing tasks across UI, API, and other interfaces | **screenplay** (for example Serenity/JS) | only when the suite has many roles and cross-interface tasks and the team accepts the extra layer |
| is used once | **inline in the test** | do not extract on the first use |

Start inline, promote to a helper on repetition, to a page object or fixture when the rule above says so.

## Fixtures

```typescript
// tests/fixtures.ts
import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from './pages/checkout-page';
import { createProduct, deleteProduct, type Product } from './data/products';

type Fixtures = {
  product: Product;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  product: async ({ request }, use) => {
    const product = await createProduct(request, { name: `Lamp ${crypto.randomUUID()}` });
    await use(product);
    await deleteProduct(request, product.id);
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };
```

Rules worth recording:

- tests import `test` and `expect` from the suite's fixtures module, not from `@playwright/test` directly
- worker-scoped fixtures (`{ scope: 'worker' }`) only for expensive, read-only, or per-worker resources such as a per-worker account
- `{ auto: true }` fixtures only for cross-cutting concerns every test needs (console error capture), and listed in the README, since they are invisible in test signatures
- prefer fixture teardown over `afterEach`

## Page objects

```typescript
// tests/pages/checkout-page.ts
import type { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly total: Locator;
  private readonly discountCode: Locator;
  private readonly applyButton: Locator;

  constructor(private readonly page: Page) {
    this.total = page.getByTestId('order-total');
    this.discountCode = page.getByLabel('Discount code');
    this.applyButton = page.getByRole('button', { name: 'Apply' });
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async applyDiscount(code: string) {
    await this.discountCode.fill(code);
    await this.applyButton.click();
  }
}
```

```typescript
test('applies a percentage discount', async ({ checkoutPage }) => {
  await checkoutPage.goto();
  await checkoutPage.applyDiscount('SAVE10');
  await expect(checkoutPage.total).toHaveText('90.00');
});
```

Boundaries to decide and record:

- **methods express intent** (`applyDiscount`), not mechanics (`clickApplyButton`)
- **locators** are user-facing (`getByRole`, `getByLabel`, `getByTestId`), defined once in the page object
- **assertions**: either "tests assert, page objects expose locators", or "page objects may expose named checks such as `expectLoaded()`". Pick one.
- **no waits by duration, no test data, no navigation side effects** hidden in getters
- **composition over inheritance**: a component object for a header or a date picker, composed into pages; a shallow base class at most
- **page objects are not created for every page**; small pages are used inline

## Helpers

```typescript
// tests/data/builders.ts
export function buildAddress(overrides: Partial<Address> = {}): Address {
  return { street: '1 Test Street', city: 'Testville', postcode: '00-001', ...overrides };
}
```

Helpers with side effects (they call the API) are usually fixtures in disguise. If they create something, they should also clean it up, which is what a fixture gives you.

## Screenplay

Actors with abilities (browse the web, call an API) perform tasks made of interactions and ask questions. It pays when:

- there are many roles whose tasks are shared and combined
- tasks cross interfaces (start in the UI, verify by API, read an email)
- the suite is large and long-lived, and the team has someone who will own the pattern

It costs: a framework or a home-grown layer to learn, more indirection for developers who write occasional tests, and harder debugging. For a single-app suite with a few roles, fixtures plus page objects cover the same needs. Record the choice either way.

## Anti-patterns

- a `BasePage` with dozens of generic methods inherited by every page object
- page objects that construct other page objects on navigation, building a hidden graph
- a "utils" file that mixes stateless helpers, API calls with side effects, and assertions
- custom wrappers over Playwright actions (`clickElement(selector)`) that remove auto-waiting or strictness
- abstractions written before any test uses them
