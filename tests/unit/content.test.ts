import { expect, it, vi } from 'vitest';
import { getNode, HOME_PATH, slugify } from '../../src/data/filesystem';
import { projects, earlierProjects, findProject } from '../../src/data/projects';
import { repos } from '../../src/data/repos';
import { codexa } from '../../src/data/model';
import { WIDGET_PROJECTS } from '../../src/components/phone/homeLayout';
import { fetchPublicRepos, merge, parseRepos } from '../../src/hooks/useGithubRepos';

it('features eight unique public projects with working navigation targets', () => {
  expect(projects).toHaveLength(8);
  expect(new Set(projects.map(p=>p.id)).size).toBe(8);
  for(const p of projects) {
    expect(p.summary.length).toBeGreaterThan(40); expect(p.proof.length).toBeGreaterThan(80);
    expect(p.technologies.length).toBeGreaterThan(2);
    expect(repos.some(r=>r.url===p.github)).toBe(true);
    expect(findProject(p.id)).toBe(p);
    const node=getNode([...HOME_PATH,'Projects',`${slugify(p.title)}.md`]);
    expect(node?.kind).toBe('file');
    if(node?.kind==='file') expect(node.opens).toEqual({app:'projects',arg:p.id});
  }
  for(const p of WIDGET_PROJECTS) expect(findProject(p.id)).toBeDefined();
});
it('uses a canonical public inventory without obsolete/private fallback entries', () => {
  expect(repos).toHaveLength(14);
  expect(new Set(repos.map(r=>r.name.toLowerCase())).size).toBe(14);
  for(const r of repos) expect(r.url).toBe(`https://github.com/golba98/${r.name}`);
  expect(repos.map(r=>r.name)).not.toContain('Movie_App');
  for(const p of earlierProjects) if(p.github) expect(repos.some(r=>r.url===p.github)).toBe(true);
});
it('binds v3 architecture and measurements without a v1 chart', () => {
  expect(findProject(codexa.projectId)?.github).toContain('Codexa-LLM-v3-PyTorch-250M');
  expect(codexa.spec[0]?.value).toBe('248,687,488');
  expect(codexa.loss).toBeUndefined();
  expect(new Set(codexa.counters.map(c => c.label)).size).toBe(codexa.counters.length);
  expect(codexa.counters.map(c=>c.value)).toEqual([500006912,15259,3.048003,606208]);
});
const apiRepo=(name:string)=>({name,html_url:`https://github.com/golba98/${name}`,description:null,fork:false});
it('validates URLs and merges names case-insensitively without forks or duplicates', () => {
  expect(parseRepos([{...apiRepo('evil'),html_url:'https://evil.example'}])).toBeNull();
  const parsed=parseRepos([apiRepo('ubume-cli'),apiRepo('ubume-cli'),{...apiRepo('fork'),fork:true}])!;
  expect(merge(parsed)).toHaveLength(1); expect(merge(parsed)[0]?.description).toContain('terminal');
});
it('fetches every page and rejects partial failures', async () => {
  const fetchMock=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>Array.from({length:100},(_,i)=>apiRepo(`repo${i}`))}).mockResolvedValueOnce({ok:true,json:async()=>[apiRepo('last')]});
  vi.stubGlobal('fetch',fetchMock);
  expect(await fetchPublicRepos(new AbortController().signal)).toHaveLength(101);
  expect(fetchMock.mock.calls[1]?.[0]).toContain('page=2');
  fetchMock.mockResolvedValueOnce({ok:true,json:async()=>Array.from({length:100},(_,i)=>apiRepo(`repo${i}`))}).mockResolvedValueOnce({ok:false,status:403});
  await expect(fetchPublicRepos(new AbortController().signal)).rejects.toThrow('403');
  vi.unstubAllGlobals();
});
