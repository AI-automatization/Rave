---
name: webapp-testing
description: Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.
argument-hint: "webapp-testing"
---

# Web Application Testing

To test local web applications, write native Python Playwright scripts.

**Helper Scripts**: Use `playwright` via Node.js (WeWatch uses `npx playwright`).

## Decision Tree: Choosing Your Approach

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
    │         Then write Playwright script using selectors
    │
    └─ No (dynamic webapp) → Is the server already running?
        ├─ No → Run dev server first: npm run dev (port 3000)
        │
        └─ Yes → Reconnaissance-then-action:
            1. Navigate and wait for networkidle
            2. Take screenshot or inspect DOM
            3. Identify selectors from rendered state
            4. Execute actions with discovered selectors
```

## WeWatch Web App Testing Pattern

```typescript
import { test, expect } from '@playwright/test';

test('landing page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Screenshot for visual verification
  await page.screenshot({ path: '/tmp/landing.png', fullPage: true });
  
  // Assert key elements
  await expect(page.locator('h1')).toBeVisible();
});
```

## Common Patterns for WeWatch

### Language switching (uz/ru/en)
```typescript
// Click language switcher
await page.click('[data-lang-switch]');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/lang-ru.png' });
```

### Auth flow testing
```typescript
await page.goto('http://localhost:3000/login');
await page.fill('input[type="email"]', 'test@example.com');
await page.fill('input[type="password"]', 'TestPass123');
await page.click('button[type="submit"]');
await page.waitForURL('**/home');
```

### Watch Party UI testing
```typescript
await page.goto('http://localhost:3000/party/test-room');
await page.waitForLoadState('networkidle');
// Verify sync indicators visible
await expect(page.locator('[data-sync-indicator]')).toBeVisible();
```

## Reconnaissance-Then-Action Pattern

1. **Inspect rendered DOM**:
   ```typescript
   await page.screenshot({ path: '/tmp/inspect.png', fullPage: true });
   const content = await page.content();
   const buttons = await page.locator('button').all();
   ```

2. **Identify selectors** from inspection results

3. **Execute actions** using discovered selectors

## Best Practices

- Always `waitForLoadState('networkidle')` before assertions on dynamic pages
- Use `data-testid` attributes for stable selectors (prefer over CSS/text)
- Capture screenshots at key steps for visual debugging
- For WeWatch: test all 3 locales (uz/ru/en) — translations can break layouts
- Run `npx playwright test` from `apps/web/` directory

## Running Tests

```bash
cd apps/web
npx playwright test                    # all tests
npx playwright test --headed           # visible browser
npx playwright test landing.spec.ts    # specific file
npx playwright show-report             # open HTML report
```

## Common Pitfall

❌ **Don't** inspect the DOM before waiting for `networkidle` on dynamic apps
✅ **Do** wait for `page.waitForLoadState('networkidle')` before inspection
