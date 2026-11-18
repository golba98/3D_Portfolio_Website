import { expect, test } from '@playwright/test';

test('Projects chunk failure can retry the exact destination', async ({ page }) => {
  let offline = true;
  await page.route(/\/Projects(?:-[\w-]+\.js|\.tsx)(?:\?.*)?$/, (route) => {
    if (offline) return route.abort();
    return route.continue();
  });
  await page.goto('/#/desktop/projects/syncroedit');
  const retry = page.getByRole('button', { name: 'Retry Projects' });
  await expect(retry).toBeVisible();
  offline = false;
  await retry.click();
  await expect(page.getByRole('heading', { name: 'SyncroEdit', exact: true })).toBeVisible();
});

test('portfolio entry works while the room model is pending', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/pc-setup.glb', async (route) => {
    await pending;
    await route.abort();
  });
  try {
    const modelRequested = page.waitForRequest('**/pc-setup.glb');
    await page.goto('/');
    await modelRequested;
    await page.getByRole('link', { name: 'View projects' }).click();
    await expect(page.getByRole('heading', { name: 'Project library' })).toBeVisible();
  } finally {
    release();
  }
});

test('a disabled WebGL context leaves a working portfolio', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        return type.includes('webgl') ? null : Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Retry room' })).toBeVisible();
  await page.getByRole('link', { name: 'View projects' }).click();
  await expect(page.getByRole('heading', { name: 'Project library' })).toBeVisible();
});
