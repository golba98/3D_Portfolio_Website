import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const resumePath = fileURLToPath(new URL('../../public/Resume.pdf', import.meta.url));

for (const mobile of [false, true]) {
  test(`resume download preserves the standard filename and PDF (${mobile ? 'mobile' : 'desktop'})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(mobile ? '/#/desktop' : '/#/desktop/about');

    const link = page.getByRole('link', { name: mobile ? 'CV' : 'Download CV', exact: true });
    await expect(link).toHaveAttribute('href', '/Resume.pdf');
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);

    expect(download.suggestedFilename()).toBe('Resume.pdf');
    expect(await download.failure()).toBeNull();
    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    const expected = await readFile(resumePath);
    expect(expected.subarray(0, 5).toString()).toBe('%PDF-');
    expect(await readFile(downloadedPath!)).toEqual(expected);
  });
}
