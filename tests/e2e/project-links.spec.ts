import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`project links follow browser history and survive refresh at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    const roomRequests: string[] = [];
    page.on('request', (request) => {
      if (/pc-setup\.glb|\/World[.-]/.test(request.url())) roomRequests.push(request.url());
    });
    await page.goto('/#/desktop/projects');
    const search = page.getByRole('searchbox', { name: 'Search projects' });
    await search.fill('PPL');
    const card = page.getByRole('link', { name: /HP Prime Emulator/ });
    await expect(card).toHaveAttribute('href', '#/desktop/projects/hp-prime-emulator');
    await card.click();
    await expect(page).toHaveURL(/#\/desktop\/projects\/hp-prime-emulator$/);
    await expect(page.getByRole('heading', { name: 'HP Prime Emulator', exact: true })).toBeVisible();
    await page.goBack();
    await expect(search).toHaveValue('PPL');
    await expect(card).toBeFocused();
    await page.goForward();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'HP Prime Emulator', exact: true })).toBeVisible();
    const shared = await context.newPage();
    await shared.goto(page.url());
    await expect(shared.getByRole('heading', { name: 'HP Prime Emulator', exact: true })).toBeVisible();
    await shared.close();
    await page.goto('/#/desktop/projects/unknown');
    await expect(page.getByRole('alert')).toContainText('project link is unavailable');
    await expect(search).toHaveValue('');
    expect(roomRequests).toEqual([]);
  });
}

test('denied clipboard leaves a selectable project address', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Access denied')) },
    }),
  );
  await page.goto('/#/desktop/projects/syncroedit');
  await page.getByRole('button', { name: 'Copy project link' }).click();
  await expect(page.getByRole('status')).toContainText('Copy unavailable');
  await expect(page.getByRole('textbox', { name: 'Project link' })).toHaveValue(page.url());
});
