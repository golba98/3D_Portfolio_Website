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
  pushed_at: string;
}

export type RepoSource = 'static' | 'loading' | 'live' | 'unreachable';

interface GithubRepos {
  repos: readonly Repo[];
  source: RepoSource;
  /** Number of public, non-fork repos when live. */
  publicCount: number | null;
}

const CACHE_KEY = 'github-repos-v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache(): GithubApiRepo[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: GithubApiRepo[] };
    return Date.now() - parsed.at < CACHE_TTL_MS ? parsed.data : null;
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
    updatedAt: repo.pushed_at,
  });
  const known = staticRepos.flatMap((repo) => {
    const live = byName.get(repo.name);
    return live ? [toRepo(live)] : [];
  });
  const extra = own
    .filter((repo) => !repoDescriptions.has(repo.name))
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
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
        const data = (await response.json()) as GithubApiRepo[];
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
