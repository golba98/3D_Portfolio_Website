import { describe, expect, it } from 'vitest';
import { projects } from '../../src/data/projects';
import { searchProjects } from '../../src/lib/projectSearch';
import { searchPortfolio } from '../../src/lib/portfolioSearch';

describe('project discovery', () => {
  it('matches words across capabilities and technologies regardless of case or whitespace', () => {
    expect(searchProjects('  RUST   debugger ').map((project) => project.id)).toEqual(['hp-prime-emulator']);
    expect(searchProjects('save export').map((project) => project.id)).toEqual(['game']);
    expect(searchProjects('no-such-project')).toEqual([]);
  });

  it('combines categories and text without changing the project inventory', () => {
    expect(searchProjects('')).toEqual(projects);
    expect(searchProjects('', 'Systems').map((project) => project.id)).toEqual(['mygui', 'http-server']);
    expect(searchProjects('Rust', 'Systems')).toEqual([]);
  });

  it('keeps app launchers available while exposing individual project destinations', () => {
    expect(searchPortfolio('  ').apps).toHaveLength(6);
    expect(searchPortfolio('  ').projects).toEqual([]);
    expect(searchPortfolio('terminal').apps.map((app) => app.id)).toContain('terminal');
    expect(searchPortfolio('SyncroEdit').projects.map((project) => project.id)).toEqual(['syncroedit']);
    expect(searchPortfolio('no-such-thing')).toEqual({ apps: [], projects: [] });
  });
});
