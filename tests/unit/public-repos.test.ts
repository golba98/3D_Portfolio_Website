import { expect, it } from 'vitest';
import { repos } from '../../src/data/repos';
import { projects } from '../../src/data/projects';

// Explicit online check; deterministic unit tests do not depend on GitHub uptime.
it.skipIf(process.env.CHECK_PUBLIC_REPOS !== '1')('every fallback/featured URL is currently public, owned and non-fork', async () => {
  const inventory: { html_url: string; fork: boolean; private: boolean; owner: { login: string } }[] = [];
  for (let page = 1; ; page++) {
    const response = await fetch(`https://api.github.com/users/golba98/repos?per_page=100&type=owner&page=${page}`, { signal: AbortSignal.timeout(15000) });
    expect(response.ok).toBe(true);
    const batch = await response.json();
    inventory.push(...batch);
    if (batch.length < 100) break;
  }
  const publicUrls = inventory.filter(r => !r.private && !r.fork && r.owner.login === 'golba98').map(r => r.html_url).sort();
  expect(repos.map(r => r.url).sort()).toEqual(publicUrls);
  for (const project of projects) expect(publicUrls).toContain(project.github);
}, 60000);
