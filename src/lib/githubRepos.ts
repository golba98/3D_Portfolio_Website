import { profile } from '../data/profile';
import { repoDescriptions, repos as staticRepos } from '../data/repos';
import type { Repo } from '../types/content';

export interface GithubApiRepo {
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  pushed_at: string | null;
}

type GithubApiInput = Pick<GithubApiRepo, 'name' | 'html_url' | 'description' | 'fork'> &
  Partial<Pick<GithubApiRepo, 'language' | 'stargazers_count' | 'pushed_at'>>;

const CACHE_KEY = 'github-repos-v2';
const CACHE_TTL_MS = 60 * 60 * 1000;

function isGithubApiRepo(value: unknown): value is GithubApiInput {
  if (!value || typeof value !== 'object') return false;
  const repo = value as Record<string, unknown>;
  return (
    typeof repo.name === 'string' &&
    /^[\w.-]{1,100}$/.test(repo.name) &&
    repo.name !== '.' &&
    repo.name !== '..' &&
    repo.html_url === `${profile.github}/${repo.name}` &&
    (repo.description === null || typeof repo.description === 'string') &&
    typeof repo.fork === 'boolean' &&
    repo.private !== true &&
    (repo.language === undefined || repo.language === null || typeof repo.language === 'string') &&
    (repo.stargazers_count === undefined ||
      (typeof repo.stargazers_count === 'number' &&
        Number.isSafeInteger(repo.stargazers_count) &&
        repo.stargazers_count >= 0)) &&
    (repo.pushed_at === undefined ||
      repo.pushed_at === null ||
      (typeof repo.pushed_at === 'string' && Number.isFinite(Date.parse(repo.pushed_at))))
  );
}

/** Both the API and browser storage are runtime input, regardless of TypeScript types. */
export function parseGithubRepos(value: unknown): GithubApiRepo[] | null {
  if (!Array.isArray(value) || !value.every(isGithubApiRepo)) return null;
  return value.map((repo) => ({
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    language: repo.language ?? null,
    stargazers_count: repo.stargazers_count ?? 0,
    pushed_at: repo.pushed_at ?? null,
  }));
}

export function readGithubReposCache(): GithubApiRepo[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const cached = parsed as { at?: unknown; data?: unknown };
    if (typeof cached.at !== 'number' || !Number.isFinite(cached.at)) return null;
    const age = Date.now() - cached.at;
    return age >= 0 && age < CACHE_TTL_MS ? parseGithubRepos(cached.data) : null;
  } catch {
    return null;
  }
}

export function writeGithubReposCache(data: GithubApiRepo[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Storage unavailable (private mode, quota) — just refetch next time.
  }
}

/** Keep curated ordering; live membership remains authoritative. */
export function mergeGithubRepos(api: GithubApiRepo[]): Repo[] {
  const byName = new Map(api.filter((repo) => !repo.fork).map((repo) => [repo.name.toLowerCase(), repo]));
  const toRepo = (repo: GithubApiRepo): Repo => ({
    name: repo.name,
    url: repo.html_url,
    description: repoDescriptions.get(repo.name.toLowerCase()) ?? repo.description ?? '',
    language: repo.language,
    stars: repo.stargazers_count,
    updatedAt: repo.pushed_at ?? undefined,
  });
  const known = staticRepos.flatMap((repo) => {
    const live = byName.get(repo.name.toLowerCase());
    return live ? [toRepo(live)] : [];
  });
  const extra = [...byName.values()]
    .filter((repo) => !repoDescriptions.has(repo.name.toLowerCase()))
    .sort((a, b) => {
      if (a.pushed_at === null) return b.pushed_at === null ? 0 : 1;
      if (b.pushed_at === null) return -1;
      return Date.parse(b.pushed_at) - Date.parse(a.pushed_at);
    })
    .map(toRepo);
  return [...known, ...extra];
}

/** Fetch every page before publishing or caching a complete inventory. */
export async function fetchPublicRepos(signal: AbortSignal): Promise<GithubApiRepo[]> {
  const all: GithubApiRepo[] = [];
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/users/${profile.githubUsername}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
      {
        signal: requestSignal,
        headers: { Accept: 'application/vnd.github+json' },
      },
    );
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const data = parseGithubRepos(await response.json());
    if (!data) throw new Error('GitHub returned invalid repository data');
    all.push(...data);
    if (data.length < 100) return all;
  }
}
