import { expect, test } from '@playwright/test';

const representativePages = [
  '/ru',
  '/uz',
  '/en',
  '/ru/guides/smotret-vmeste-onlayn',
  '/uz/how-it-works',
  '/en/guides/watch-youtube-together',
] as const;

for (const path of representativePages) {
  test.describe(`stage 5 accessibility: ${path}`, () => {
    test('visible controls have accessible names', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const unnamed = await page.locator('button, a[href], input, select, textarea').evaluateAll((elements) =>
        elements
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
          })
          .filter((element) => {
            const labelledBy = element.getAttribute('aria-labelledby');
            const labelledText = labelledBy
              ?.split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent ?? '')
              .join(' ')
              .trim();
            const input = element as HTMLInputElement;
            return !(
              element.getAttribute('aria-label')?.trim()
              || labelledText
              || element.getAttribute('title')?.trim()
              || element.textContent?.trim()
              || input.alt?.trim()
              || input.placeholder?.trim()
            );
          })
          .map((element) => element.outerHTML.slice(0, 220)),
      );

      expect(unnamed).toEqual([]);
    });

    test('images expose alt text and reserve rendered space', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const failures = await page.locator('img').evaluateAll((images) =>
        images
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            const style = getComputedStyle(image);
            const hasAlt = image.hasAttribute('alt');
            const hasReservedSpace = (rect.width > 0 && rect.height > 0)
              || (image.hasAttribute('width') && image.hasAttribute('height'))
              || style.aspectRatio !== 'auto';
            return !hasAlt || !hasReservedSpace;
          })
          .map((image) => image.outerHTML.slice(0, 220)),
      );

      expect(failures).toEqual([]);
    });

    test('keyboard navigation receives a visible focus indicator', async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      for (let index = 0; index < 5; index += 1) {
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(() => {
          const element = document.activeElement as HTMLElement | null;
          if (!element || element === document.body) return null;
          const style = getComputedStyle(element);
          return {
            tag: element.tagName,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
          };
        });

        expect(focus, `Tab ${index + 1} on ${path} must focus an interactive element`).not.toBeNull();
        expect(
          focus!.outlineStyle !== 'none' && focus!.outlineWidth !== '0px'
            || focus!.boxShadow !== 'none',
          `Tab ${index + 1} on ${path} must show a focus indicator`,
        ).toBe(true);
      }
    });
  });
}
