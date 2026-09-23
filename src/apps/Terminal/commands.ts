import { APPS, isAppId } from '../../apps/registry';
import { background } from '../../data/background';
import { formatPath, getNode, HOME_PATH, resolvePath } from '../../data/filesystem';
import { hardware, knownHardware } from '../../data/hardware';
import { profile } from '../../data/profile';
import { projects } from '../../data/projects';
import { siteInfo } from '../../data/site';
import { skillGroups } from '../../data/skills';
import type { AppId } from '../../types/apps';
import type { FsPath } from '../../types/filesystem';

/**
 * A purely simulated shell. Commands only read the portfolio data and the
 * virtual file system; nothing is evaluated and nothing leaves the browser.
 */

export type Tone = 'muted' | 'accent' | 'error' | 'success' | 'dir' | 'bold';

export type Segment = string | { text: string; tone?: Tone; href?: string };

export type OutputLine = readonly Segment[];

export interface ShellContext {
  cwd: FsPath;
  setCwd: (path: FsPath) => void;
  history: readonly string[];
  openApp: (id: AppId, arg?: string) => void;
  clear: () => void;
  /** Seconds since the terminal opened, for `uptime`-like output. */
  uptime: () => number;
}

export interface Command {
  summary: string;
  usage?: string;
  /** What Tab should complete for the first argument. */
  completes?: 'path' | 'app';
  run: (args: readonly string[], ctx: ShellContext) => OutputLine[];
}

const t = (text: string, tone?: Tone): Segment => ({ text, tone });
const link = (text: string, href: string): Segment => ({ text, href });
const lines = (...rows: (string | OutputLine)[]): OutputLine[] => rows.map((row) => (typeof row === 'string' ? [row] : row));
const error = (message: string): OutputLine[] => [[t(message, 'error')]];

/** The banner from my real ~/.zshrc (via the previous site). */
/** The banner from my real ~/.zshrc. */
export const BANNER = ['  ▄▀▄ ▄▀▄    Developer Environment', '  █▄███▄█', '   ▀▄▄▄▀     Ready to Ship'];

function formatUptime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m} min, ${s} s` : `${s} s`;
}

export const COMMANDS: Record<string, Command> = {
  help: {
    summary: 'List available commands',
    run: () => [
      [t('Available commands', 'bold')],
      ...Object.entries(COMMANDS)
        .filter(([name]) => name !== 'sudo')
        .map(([name, cmd]): OutputLine => [t(`  ${(cmd.usage ?? name).padEnd(18)}`, 'accent'), t(cmd.summary, 'muted')]),
      [''],
      [t('Tab completes, ↑/↓ browse history, Ctrl+L clears.', 'muted')],
    ],
  },

  about: {
    summary: 'Who I am',
    run: () =>
      lines(
        [t(profile.name, 'bold')],
        `${profile.role} · ${profile.location}`,
        profile.education,
        '',
        profile.headline.join(' '),
        profile.lede,
        '',
        [t('More: ', 'muted'), t('open about', 'accent'), t(' or ', 'muted'), t('cat ~/About/background.txt', 'accent')],
      ),
  },

  projects: {
    summary: 'What I built',
    run: () => [
      ...projects.map((p): OutputLine => [t(p.title.padEnd(15), 'bold'), t(`${p.year.padEnd(20)}`, 'muted'), p.role]),
      [''],
      [t('Details: ', 'muted'), t('open projects', 'accent'), t(' or ', 'muted'), t('ls ~/Projects', 'accent')],
    ],
  },

  skills: {
    summary: 'What I work with',
    run: () => [
      [t(profile.toolkitLede, 'muted')],
      [''],
      ...skillGroups.map((g): OutputLine => [t(`${g.label}:`.padEnd(20), 'accent'), g.items.join(', ')]),
    ],
  },

  background: {
    summary: 'How I got here',
    run: () => background.flatMap((e): OutputLine[] => [[t(e.title, 'bold')], [t(`  ${e.detail}`, 'muted')]]),
  },

  contact: {
    summary: 'How to reach me',
    run: () => [
      [t('Email   ', 'muted'), link(profile.email, `mailto:${profile.email}`)],
      [t('GitHub  ', 'muted'), link(profile.github, profile.github)],
      [t('CV      ', 'muted'), link('Resume.pdf', profile.resumeUrl)],
    ],
  },

  github: {
    summary: 'My GitHub profile',
    run: () => [[link(profile.github, profile.github)]],
  },

  hardware: {
    summary: 'The machine behind the desk',
    run: () => knownHardware().map((spec): OutputLine => [t(spec.label.padEnd(12), 'accent'), spec.value ?? '']),
  },

  neofetch: {
    summary: 'System summary',
    run: (_args, ctx) => {
      const info: OutputLine[] = [
        [t(`${hardware.user}@${hardware.hostname}`, 'accent')],
        [t('─'.repeat(hardware.user.length + hardware.hostname.length + 1), 'muted')],
        ...knownHardware().map((spec): OutputLine => [t(`${spec.label}: `, 'accent'), spec.value ?? '']),
        [t('Shell: ', 'accent'), 'zsh (simulated)'],
        [t('Uptime: ', 'accent'), formatUptime(ctx.uptime())],
        [t('Site: ', 'accent'), siteInfo.stack.slice(0, 4).join(', ')],
      ];
      const rows = Math.max(BANNER.length, info.length);
      const out: OutputLine[] = [];
      for (let i = 0; i < rows; i += 1) {
        out.push([(BANNER[i] ?? '').padEnd(38), ...(info[i] ?? [])]);
      }
      return out;
    },
  },

  ls: {
    summary: 'List a directory',
    usage: 'ls [path]',
    completes: 'path',
    run: (args, ctx) => {
      const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd;
      const node = getNode(target);
      if (!node) return error(`ls: cannot access '${args[0]}': No such file or directory`);
      if (node.kind === 'file') return [[node.name]];
      if (node.children.length === 0) return [];
      return [
        node.children.flatMap((child, i): Segment[] => [
          ...(i > 0 ? ['  '] : []),
          child.kind === 'dir' ? t(`${child.name}/`, 'dir') : child.name,
        ]),
      ];
    },
  },

  cd: {
    summary: 'Change directory',
    usage: 'cd [path]',
    completes: 'path',
    run: (args, ctx) => {
      const target = args[0] ? resolvePath(ctx.cwd, args[0]) : HOME_PATH;
      const node = getNode(target);
      if (!node) return error(`cd: ${args[0]}: No such file or directory`);
      if (node.kind !== 'dir') return error(`cd: ${args[0]}: Not a directory`);
      ctx.setCwd(target);
      return [];
    },
  },

  pwd: {
    summary: 'Print working directory',
    run: (_args, ctx) => [[`/${ctx.cwd.join('/')}`]],
  },

  cat: {
    summary: 'Print a file',
    usage: 'cat <file>',
    completes: 'path',
    run: (args, ctx) => {
      if (!args[0]) return error('cat: missing file operand');
      const node = getNode(resolvePath(ctx.cwd, args[0]));
      if (!node) return error(`cat: ${args[0]}: No such file or directory`);
      if (node.kind === 'dir') return error(`cat: ${args[0]}: Is a directory`);
      if (node.binary) return [[t(`cat: ${args[0]}: binary file — try `, 'muted'), t(`open ${args[0]}`, 'accent')]];
      return node.content.split('\n').map((row): OutputLine => [row]);
    },
  },

  open: {
    summary: 'Open an app or file',
    usage: 'open <app|file>',
    completes: 'app',
    run: (args, ctx) => {
      const target = args[0];
      if (!target) return lines([t(`Apps: ${APPS.map((a) => a.id).join(', ')}`, 'muted')]);
      if (isAppId(target)) {
        ctx.openApp(target);
        return [[t(`Opening ${target}…`, 'muted')]];
      }
      const node = getNode(resolvePath(ctx.cwd, target));
      if (!node) return error(`open: ${target}: no such app or file`);
      if (node.kind === 'file' && node.opens) {
        ctx.openApp(node.opens.app, node.opens.arg);
        return [[t(`Opening ${node.name}…`, 'muted')]];
      }
      if (node.kind === 'file' && node.href) return [[t('Open: ', 'muted'), link(node.href, node.href)]];
      if (node.kind === 'dir') {
        ctx.openApp('files', resolvePath(ctx.cwd, target).join('/'));
        return [[t(`Opening ${formatPath(resolvePath(ctx.cwd, target))} in Files…`, 'muted')]];
      }
      return error(`open: ${target}: nothing to open it with — try cat`);
    },
  },

  echo: {
    summary: 'Print text',
    usage: 'echo [text]',
    run: (args) => [[args.join(' ')]],
  },

  whoami: {
    summary: 'Current user',
    run: () => [[hardware.user]],
  },

  date: {
    summary: 'Current date and time',
    run: () => [[new Date().toString()]],
  },

  uname: {
    summary: 'System name',
    run: (args) => [[args.includes('-a') ? `Linux ${hardware.hostname} (simulated portfolio shell) web` : 'Linux']],
  },

  history: {
    summary: 'Previous commands',
    run: (_args, ctx) => ctx.history.map((entry, i): OutputLine => [t(`${String(i + 1).padStart(4)}  `, 'muted'), entry]),
  },

  clear: {
    summary: 'Clear the screen',
    run: (_args, ctx) => {
      ctx.clear();
      return [];
    },
  },

  sudo: {
    summary: '',
    run: () => error(`${hardware.user} is not in the sudoers file. This incident will be reported.`),
  },
};

/** Printed under the banner so visitors know where to start. */
export const WELCOME: OutputLine[] = [
  [''],
  [t('A simulated shell over my portfolio. Type ', 'muted'), t('help', 'accent'), t(' to start.', 'muted')],
  [''],
];

/** Split a command line on whitespace, honouring simple quotes. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of input.matchAll(pattern)) tokens.push(match[1] ?? match[2] ?? match[3] ?? '');
  return tokens;
}

/** Longest common prefix, for Tab completion with several matches. */
function commonPrefix(values: readonly string[]): string {
  if (values.length === 0) return '';
  return values.reduce((prefix, value) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === value[i]) i += 1;
    return prefix.slice(0, i);
  });
}

export interface Completion {
  /** New input line. */
  value: string;
  /** Shown when several candidates remain. */
  options: string[];
}

export function complete(input: string, cwd: FsPath): Completion {
  const parts = input.split(' ');
  const current = parts[parts.length - 1] ?? '';

  if (parts.length === 1) {
    const matches = Object.keys(COMMANDS).filter((name) => name !== 'sudo' && name.startsWith(current));
    const only = matches[0];
    if (matches.length === 1 && only) return { value: `${only} `, options: [] };
    return { value: commonPrefix(matches) || current, options: matches.length > 1 ? matches : [] };
  }

  const command = COMMANDS[parts[0] ?? ''];
  const slash = current.lastIndexOf('/');
  const dirPart = slash >= 0 ? current.slice(0, slash + 1) : '';
  const namePart = slash >= 0 ? current.slice(slash + 1) : current;
  const candidates: string[] = [];

  if (command?.completes === 'app' && slash < 0) candidates.push(...APPS.map((a) => a.id));
  if (command?.completes === 'path' || command?.completes === 'app') {
    const node = getNode(dirPart ? resolvePath(cwd, dirPart) : cwd);
    if (node?.kind === 'dir') candidates.push(...node.children.map((c) => (c.kind === 'dir' ? `${c.name}/` : c.name)));
  }

  const matches = [...new Set(candidates)].filter((c) => c.startsWith(namePart));
  const head = parts.slice(0, -1).join(' ');
  const only = matches[0];
  if (matches.length === 1 && only) return { value: `${head} ${dirPart}${only}${only.endsWith('/') ? '' : ' '}`, options: [] };
  const prefix = commonPrefix(matches);
  return { value: `${head} ${dirPart}${prefix || namePart}`, options: matches.length > 1 ? matches : [] };
}
