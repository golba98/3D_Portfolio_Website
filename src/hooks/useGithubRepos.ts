import { useEffect, useState } from 'react';
import { profile } from '../data/profile';
import { repoDescriptions, repos as staticRepos } from '../data/repos';
import type { Repo } from '../types/content';

interface GithubApiRepo {
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

export type RepoSource = 'static' | 'loading' | 'live' | 'unreachable';

interface GithubRepos {
  repos: readonly Repo[];
  source: RepoSource;
  /** Number of public, non-fork repos when live. */
  publicCount: number | null;
}

const CACHE_KEY = 'github-repos-v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

function isGithubApiRepo(value: unknown): value is GithubApiInput {
  if (!value || typeof value !== 'object') return false;
  const repo = value as Record<string, unknown>;
  return (
    typeof repo.name === 'string' &&
    /^[\w.-]{1,100}$/.test(repo.name) &&
    repo.name !== '.' && repo.name !== '..' &&
    repo.html_url === `${profile.github}/${repo.name}` &&
    (repo.description === null || typeof repo.description === 'string') &&
    typeof repo.fork === 'boolean' &&
    (repo.language === undefined || repo.language === null || typeof repo.language === 'string') &&
    (repo.stargazers_count === undefined || (
      typeof repo.stargazers_count === 'number' &&
      Number.isSafeInteger(repo.stargazers_count) && repo.stargazers_count >= 0
    )) &&
    (repo.pushed_at === undefined || repo.pushed_at === null || (
      typeof repo.pushed_at === 'string' && Number.isFinite(Date.parse(repo.pushed_at))
    ))
  );
}

/** Both the API and browser storage are runtime input, regardless of TypeScript types. */
function parseRepos(value: unknown): GithubApiRepo[] | null {
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

function readCache(): GithubApiRepo[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const cached = parsed as { at?: unknown; data?: unknown };
    if (typeof cached.at !== 'number' || !Number.isFinite(cached.at)) return null;
    const age = Date.now() - cached.at;
    return age >= 0 && age < CACHE_TTL_MS ? parseRepos(cached.data) : null;
  } catch {
    return null;
  }
}

function writeCache(data: GithubApiRepo[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Storage unavailable (private mode, quota) — just refetch next time.
  }
}

/**
 * The previous site's descriptions stay authoritative; the public GitHub API
 * (no token) only adds language, stars and dates, plus any repos made since.
 */
function merge(api: GithubApiRepo[]): Repo[] {
  // The repo named after the account only holds the GitHub profile README.
  const own = api.filter((repo) => !repo.fork && repo.name !== profile.githubUsername);
  const byName = new Map(own.map((repo) => [repo.name, repo]));
  const toRepo = (repo: GithubApiRepo): Repo => ({
    name: repo.name,
    url: repo.html_url,
    description: repoDescriptions.get(repo.name) ?? repo.description ?? '',
    language: repo.language,
    stars: repo.stargazers_count,
    updatedAt: repo.pushed_at ?? undefined,
  });
  const known = staticRepos.flatMap((repo) => {
    const live = byName.get(repo.name);
    return live ? [toRepo(live)] : [];
  });
  const extra = own
    .filter((repo) => !repoDescriptions.has(repo.name))
    .sort((a, b) => {
      if (a.pushed_at === null) return b.pushed_at === null ? 0 : 1;
      if (b.pushed_at === null) return -1;
      return Date.parse(b.pushed_at) - Date.parse(a.pushed_at);
    })
    .map(toRepo);
  return [...known, ...extra];
}

export function useGithubRepos(): GithubRepos {
  const [state, setState] = useState<GithubRepos>(() => {
    const cached = readCache();
    return cached
      ? { repos: merge(cached), source: 'live', publicCount: cached.filter((r) => !r.fork).length }
      : { repos: staticRepos, source: 'loading', publicCount: null };
  });

  useEffect(() => {
    if (state.source !== 'loading') return;
    const controller = new AbortController();
    const url = `https://api.github.com/users/${profile.githubUsername}/repos?per_page=100&type=owner&sort=pushed`;
    fetch(url, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
        const data = parseRepos(await response.json());
        if (!data) throw new Error('GitHub returned invalid repository data');
        writeCache(data);
        setState({ repos: merge(data), source: 'live', publicCount: data.filter((r) => !r.fork).length });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ repos: staticRepos, source: 'unreachable', publicCount: null });
      });
    return () => controller.abort();
  }, [state.source]);

  return state;
}
