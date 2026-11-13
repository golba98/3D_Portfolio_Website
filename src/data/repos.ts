import type { Repo } from '../types/content';
import { profile } from './profile';
import { projects } from './projects';

export const reposSection = {
  eyebrow: 'Public code', heading: 'On GitHub',
  unreachable: 'GitHub is not reachable right now. Showing the public repository snapshot verified on 13 November 2026.',
  viewAll: 'View all repositories',
} as const;

/** Anonymous GitHub API inventory, 2026-11-13: public, owned, non-fork only. */
export const repos: readonly Repo[] = [
  ...projects.map(project => ({ name: project.github!.split('/').at(-1)!, url: project.github!, description: project.summary })),
  { name: 'IT_Pixel_Forger', description: 'C++23 and Qt 6 image-to-block mosaic application with animated GIF export and deterministic rendering.' },
  { name: 'Codexa-LLM-v1-PyTorch', description: 'Earlier PyTorch model workspace: architecture, tokenization, data, training and inference. Separate from Codexa v3.' },
  { name: 'Codexa-LLM-v2-NumPy', description: 'NumPy tensor/autograd and language-model experiment with optional CuPy. Memory and specialist modules are placeholders.' },
  { name: 'Game_Development', description: 'Original JavaScript/p5.js procedural Forest RPG and local Node map server; predecessor to Forest RPG v2.' },
  { name: '3D_Portfolio_Website', description: 'This portfolio: React, Three.js, a drawable whiteboard and simulated desktop and phone applications.' },
  { name: 'golba98', description: 'GitHub profile README; account introduction rather than a software project.' },
].map(repo => ({ ...repo, url: 'url' in repo ? repo.url : `${profile.github}/${repo.name}` }));

export const repoDescriptions: ReadonlyMap<string, string> = new Map(repos.map(repo => [repo.name.toLowerCase(), repo.description]));
