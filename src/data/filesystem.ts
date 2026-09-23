import type { FsDir, FsFile, FsNode, FsPath } from '../types/filesystem';
import { background, certifications, education, interests, leadership, workHistory } from './background';
import { hardware, knownHardware } from './hardware';
import { profile } from './profile';
import { earlierProjects, projects } from './projects';
import { repos } from './repos';
import { cvSkillGroups, skillGroups } from './skills';

/**
 * A small read-only virtual file system over the portfolio data, used by the
 * Terminal and Files apps. Everything is generated from src/data, so there is
 * no second copy of any text to keep in sync.
 */

const file = (name: string, content: string, extra: Partial<FsFile> = {}): FsFile => ({ kind: 'file', name, content, ...extra });
const dir = (name: string, children: FsNode[]): FsDir => ({ kind: 'dir', name, children });

/** Project files are named after the project, e.g. "fedora-movies.md". */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const aboutDir = dir('About', [
  file(
    'about.txt',
    [profile.name, `${profile.role} · ${profile.location}`, profile.education, '', profile.headline.join(' '), profile.lede].join('\n'),
    { opens: { app: 'about' } },
  ),
  file('background.txt', background.map((e) => `${e.title}\n  ${e.detail}`).join('\n\n')),
  file('education.txt', [`${education.institution} — ${education.degree}`, education.mode, education.note].join('\n')),
  file(
    'experience.txt',
    workHistory.map((job) => [`${job.title} (${job.period})`, ...job.points.map((p) => `  - ${p}`)].join('\n')).join('\n\n'),
  ),
  file('certifications.txt', certifications.map((c) => [`${c.title} — ${c.issuer}`, c.note ? `  ${c.note}` : ''].filter(Boolean).join('\n')).join('\n\n')),
  file('leadership.txt', leadership.map((l) => `${l.title}\n  ${l.detail}`).join('\n\n')),
  file('interests.txt', interests.map((i) => `- ${i}`).join('\n')),
]);

const projectsDir = dir('Projects', [
  ...projects.map((p) =>
    file(
      `${slugify(p.title)}.md`,
      [
        `# ${p.title}`,
        `${p.role} · ${p.year}`,
        '',
        p.summary,
        ...(p.note ? ['', p.note] : []),
        '',
        '## How it works',
        p.proof,
        '',
        `Stack: ${p.technologies.join(', ')}`,
        `Source: ${p.github}`,
        ...(p.npm ? [`npm: ${p.npm.install}`] : []),
      ].join('\n'),
      { opens: { app: 'projects', arg: p.id } },
    ),
  ),
  file('earlier-projects.txt', ['From my CV:', '', ...earlierProjects.map((p) => `- ${p.title}: ${p.description}`)].join('\n'), {
    opens: { app: 'projects', arg: 'earlier' },
  }),
]);

const skillsDir = dir('Skills', [
  file('toolkit.txt', [profile.toolkitLede, '', ...skillGroups.map((g) => `${g.label}:\n  ${g.items.join(', ')}`)].join('\n')),
  file('cv-skills.txt', cvSkillGroups.map((g) => `${g.label}:\n  ${g.items.join(', ')}`).join('\n')),
]);

const contactDir = dir('Contact', [
  file('contact.txt', [`Email:  ${profile.email}`, `GitHub: ${profile.github}`, `CV:     ~/Resume.pdf`, '', `Based in ${profile.location}.`].join('\n'), {
    opens: { app: 'contact' },
  }),
]);

const developmentDir = dir(
  'Development',
  repos.map((repo) => dir(repo.name, [file('README.md', `# ${repo.name}\n\n${repo.description}\n\n${repo.url}`, { href: repo.url })])),
);

const hardwareFile = file(
  'hardware.txt',
  [
    `${hardware.user}@${hardware.hostname}`,
    ...knownHardware().map((spec) => `${spec.label.padEnd(12)} ${spec.value ?? ''}`),
  ].join('\n'),
  { opens: { app: 'system' } },
);

const readme = file(
  'README.md',
  [
    `# ${profile.name}`,
    '',
    'This is a simulated file system over my portfolio.',
    '',
    '  About/        who I am, background, CV details',
    '  Projects/     what I built',
    '  Skills/       what I work with',
    '  Contact/      how to reach me',
    '  Development/  my public GitHub repositories',
    '  Resume.pdf    my CV',
  ].join('\n'),
);

export const HOME: FsDir = dir(hardware.user, [
  aboutDir,
  projectsDir,
  skillsDir,
  contactDir,
  developmentDir,
  readme,
  hardwareFile,
  file('Resume.pdf', '', { href: profile.resumeUrl, binary: true }),
]);

export const ROOT: FsDir = dir('', [dir('home', [HOME])]);

export const HOME_PATH: FsPath = ['home', hardware.user];

export function getNode(path: FsPath): FsNode | null {
  let node: FsNode = ROOT;
  for (const segment of path) {
    if (node.kind !== 'dir') return null;
    const next: FsNode | undefined = node.children.find((child) => child.name === segment);
    if (!next) return null;
    node = next;
  }
  return node;
}

/** Resolve a shell-style path (`~`, `..`, relative, absolute) against `cwd`. */
export function resolvePath(cwd: FsPath, input: string): FsPath {
  const raw = input.trim();
  let base: string[];
  let rest = raw;
  if (raw === '~' || raw.startsWith('~/')) {
    base = [...HOME_PATH];
    rest = raw.slice(1);
  } else if (raw.startsWith('/')) {
    base = [];
  } else {
    base = [...cwd];
  }
  for (const segment of rest.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') base.pop();
    else base.push(segment);
  }
  return base;
}

/** `/home/jordan/Projects` → `~/Projects`. */
export function formatPath(path: FsPath): string {
  const underHome = HOME_PATH.every((segment, i) => path[i] === segment);
  if (underHome) {
    const rest = path.slice(HOME_PATH.length);
    return rest.length ? `~/${rest.join('/')}` : '~';
  }
  return `/${path.join('/')}`;
}

export function isSamePath(a: FsPath, b: FsPath): boolean {
  return a.length === b.length && a.every((segment, i) => segment === b[i]);
}
