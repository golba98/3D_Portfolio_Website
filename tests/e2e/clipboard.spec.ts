import { expect, test } from '@playwright/test';
import { profile } from '../../src/data/profile';
import { projects } from '../../src/data/projects';

const installProject = projects.find((project) => project.npm)!;

for (const action of [
  { app: 'contact', button: 'Copy email address', text: profile.email },
  {
    app: 'projects',
    button: 'Copy install command',
    text: installProject.npm!.install,
    projectTitle: installProject.title,
  },
]) {
  test(`${action.button}: repeated copies keep feedback until the latest timeout`, async ({ page }) => {
    await page.addInitScript(() => {
      let copiedText = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            copiedText = text;
          },
          readText: async () => copiedText,
        },
      });
    });

    await page.goto(`/#/desktop/${action.app}`);
    if (action.projectTitle) {
      await page.getByRole('button', { name: new RegExp(`^${action.projectTitle}`) }).click();
    }
    const button = page.getByRole('button', { name: action.button });
    await expect(button).toBeVisible();
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));

    const feedback = button.locator('[aria-live="polite"]');
    await button.click();
    await expect(feedback).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(action.text);

    await page.clock.runFor(1200);
    await button.click();
    await page.clock.runFor(700);
    await expect(feedback).toHaveText('Copied');
    await page.clock.runFor(1200);
    await expect(feedback).toHaveText('');
  });
}
