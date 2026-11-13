import { useEffect, useState } from 'react';
import { repos as staticRepos } from '../data/repos';
import type { Repo } from '../types/content';
import {
  fetchPublicRepos,
  mergeGithubRepos,
  readGithubReposCache,
  writeGithubReposCache,
  type GithubApiRepo,
} from '../lib/githubRepos';

export type RepoSource = 'static' | 'loading' | 'live' | 'unreachable';

interface GithubRepos {
  repos: readonly Repo[];
  source: RepoSource;
  /** Number of public, non-fork repos when live. */
  publicCount: number | null;
}

/** Derive the list and count together for both cache hits and API responses. */
function liveReposState(data: GithubApiRepo[]): GithubRepos {
  const repos = mergeGithubRepos(data);
  return { repos, source: 'live', publicCount: repos.length };
}

export function useGithubRepos(): GithubRepos {
  const [state, setState] = useState<GithubRepos>(() => {
    const cached = readGithubReposCache();
    return cached ? liveReposState(cached) : { repos: staticRepos, source: 'loading', publicCount: null };
  });

  useEffect(() => {
    if (state.source !== 'loading') return;
    const controller = new AbortController();
    fetchPublicRepos(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        writeGithubReposCache(data);
        setState(liveReposState(data));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ repos: staticRepos, source: 'unreachable', publicCount: null });
      });
    return () => controller.abort();
  }, [state.source]);

  return state;
}
