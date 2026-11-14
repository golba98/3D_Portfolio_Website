import { expect, test } from '@playwright/test';

for (const mobile of [false, true]) {
  test(`project gallery filters, details and back navigation (${mobile ? 'phone' : 'Linux'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/desktop/projects');
    const catalog = page.getByRole('region', { name: 'Built to explore.' });
    await expect(catalog.getByRole('status')).toHaveText('8 projects');
    await catalog.getByRole('button', { name: 'Systems', exact: true }).click();
    await expect(catalog.getByRole('status')).toHaveText('2 projects');
    await catalog.getByRole('searchbox').fill('C++23');
    await expect(catalog.getByRole('status')).toHaveText('1 project');
    await catalog.getByRole('button', { name: mobile ? 'HTTP Server' : 'Explore HTTP Server', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'HTTP Server', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'What you can do' }).getByRole('listitem')).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'Explore the code' })).toHaveAttribute(
      'href',
      'https://github.com/golba98/HTTP-Server',
    );
    await (mobile ? page.getByRole('region', { name: 'Projects', exact: true }) : page)
      .getByRole('button', { name: mobile ? 'Projects' : /Browse projects/, exact: mobile })
      .click();
    await expect(catalog.getByRole('searchbox')).toHaveValue('C++23');
    await expect(catalog.getByRole('button', { name: 'Systems', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await catalog.getByRole('searchbox').fill('no-matching-project');
    await expect(catalog.getByRole('status')).toHaveText('0 projects');
    await catalog.getByRole('button', { name: 'Clear filters' }).click();
    await expect(catalog.getByRole('status')).toHaveText('8 projects');
    await page.screenshot({ path: `.private/interface-review/verified-gallery-${mobile ? 'phone' : 'desktop'}.png` });
    if (mobile) {
      await page.setViewportSize({ width: 320, height: 568 });
      const bounds = await catalog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    }
  });

  test(`system search opens and reopens the exact project (${mobile ? 'phone' : 'Linux'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/desktop');
    const launchSearch = async () => {
      if (mobile) await page.getByRole('button', { name: 'Search', exact: true }).click();
      else await page.getByRole('button', { name: 'Activities', exact: true }).click();
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      await launchSearch();
      const search = page.getByRole('searchbox', { name: 'Search apps and projects' });
      await search.fill('SyncroEdit');
      await expect(
        page.getByRole('region', { name: 'Project results' }).getByRole('button', { name: /^SyncroEdit/ }),
      ).toBeVisible();
      await page.screenshot({ path: `.private/interface-review/search-${mobile ? 'phone' : 'desktop'}.png` });
      await search.press('Enter');
      await expect(page.getByRole('heading', { name: 'SyncroEdit', exact: true })).toBeVisible();
      await (mobile ? page.getByRole('region', { name: 'Projects', exact: true }) : page)
        .getByRole('button', { name: mobile ? 'Projects' : /Browse projects/, exact: mobile })
        .click();
      await expect(page.getByRole('heading', { name: 'Built to explore.' })).toBeVisible();
      if (mobile) await page.getByRole('button', { name: 'Home', exact: true }).click();
    }
    await launchSearch();
    const search = page.getByRole('searchbox', { name: 'Search apps and projects' });
    await search.fill('no-matching-project');
    await expect(
      page.getByRole('dialog', { name: mobile ? 'Search' : 'Activities', exact: true }).getByRole('status'),
    ).toContainText('No apps or projects');
    await search.press('Escape');
    await expect(page.getByRole('dialog', { name: mobile ? 'Search' : 'Activities', exact: true })).toHaveCount(0);
    if (!mobile) {
      await page
        .getByText('Explore the work', { exact: true })
        .locator('xpath=ancestor::header')
        .click({ button: 'right' });
      await page.getByRole('menuitem', { name: /^Minimise/ }).click();
      await expect(page.getByRole('heading', { name: 'Built to explore.' })).not.toBeVisible();
      await page.keyboard.press('Control+k');
      const running = page.getByRole('region', { name: 'Open windows' });
      await expect(running.getByRole('button', { name: /^Projects/ })).toContainText('Minimized');
      await running.getByRole('button', { name: /^Projects/ }).click();
      await expect(page.getByRole('heading', { name: 'Built to explore.' })).toBeVisible();
    }
  });
}
