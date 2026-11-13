import { expect, it, vi } from 'vitest';
import { fetchPublicRepos, mergeGithubRepos, parseGithubRepos } from '../../src/lib/githubRepos';

const apiRepo = (name: string) => ({
  name,
  html_url: `https://github.com/golba98/${name}`,
  description: null,
  fork: false,
});
it('validates URLs and merges names case-insensitively without forks or duplicates', () => {
  expect(parseGithubRepos([{ ...apiRepo('evil'), html_url: 'https://evil.example' }])).toBeNull();
  const parsed = parseGithubRepos([apiRepo('ubume-cli'), apiRepo('ubume-cli'), { ...apiRepo('fork'), fork: true }])!;
  expect(mergeGithubRepos(parsed)).toHaveLength(1);
  expect(mergeGithubRepos(parsed)[0]?.description).toContain('terminal');
});
it('fetches every page and rejects partial failures', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => Array.from({ length: 100 }, (_, i) => apiRepo(`repo${i}`)) })
    .mockResolvedValueOnce({ ok: true, json: async () => [apiRepo('last')] });
  vi.stubGlobal('fetch', fetchMock);
  expect(await fetchPublicRepos(new AbortController().signal)).toHaveLength(101);
  expect(fetchMock.mock.calls[1]?.[0]).toContain('page=2');
  fetchMock
    .mockResolvedValueOnce({ ok: true, json: async () => Array.from({ length: 100 }, (_, i) => apiRepo(`repo${i}`)) })
    .mockResolvedValueOnce({ ok: false, status: 403 });
  await expect(fetchPublicRepos(new AbortController().signal)).rejects.toThrow('403');
});
