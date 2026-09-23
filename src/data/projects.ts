import type { EarlierProject, Project, TerminalScreen } from '../types/content';

/**
 * Projects migrated verbatim from the previous site's src/content.js, which
 * notes: every claim here is checkable — don't add a number you can't point at
 * a source for.
 */

/** Ubume's startup screen, read out of the Ubume v0.1.0 source on 2026-09-13. */
const ubumeStartup: TerminalScreen = {
  cols: 100,
  rows: 22,
  logoWidth: 45,
  logo: [
    '██╗   ██╗██████╗ ██╗   ██╗███╗   ███╗███████╗',
    '██║   ██║██╔══██╗██║   ██║████╗ ████║██╔════╝',
    '██║   ██║██████╔╝██║   ██║██╔████╔██║█████╗  ',
    '██║   ██║██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝  ',
    '╚██████╔╝██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗',
    ' ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝',
  ],
  logoTone: [1, 1, 2, 2, 3, 3],
  meta: ['Ubume v0.1.0', 'Workspace: Ubume', 'Provider: Local'],
  prompt: '❯ ',
  placeholder: 'Ask Ubume, run !shell, or use /command',
  footerLeft: 'Local / qwen/qwen3.8-27b',
  footerRight: 'Context: 0 / 131K',
};

/** Ubume really switches to this one-row logo between 48 and 72 columns. */
const ubumeStartupCompact: TerminalScreen = {
  ...ubumeStartup,
  cols: 48,
  rows: 14,
  logo: ['✦ UBUME'],
  logoTone: [1],
  logoWidth: 7,
};

export const projectsSection = {
  eyebrow: 'Work',
  heading: 'What I built',
  lede: 'Five projects. All of them run.',
} as const;

export const projects: readonly Project[] = [
  {
    id: 'syncroedit',
    title: 'SyncroEdit',
    year: 'Dec 2025 — Current',
    role: 'Real-time collaborative editor',
    summary:
      'A document workspace you sign into. Several people can be in the same document at once, each typing wherever they like — every keystroke lands on the other screens, alongside a chat panel for the conversation around the text, and no one overwrites anyone.',
    note: "A long project, and years of it still ahead. It isn't aimed at becoming a real product — it is the place where each new skill gets applied to something already running: tighter security, DevOps, CI/CD, whatever comes next.",
    proof:
      'Yjs CRDTs over WebSockets. A Durable Object owns each room, keeps its state in sync, relays presence, and persists to D1 on a debounce; a second Durable Object class holds the abuse counters, and the socket opens on a short-lived ticket rather than the session token. Hono routes and authenticates on Cloudflare, with email-verified signup. A Playwright test drives two browsers through one document, takes one offline mid-edit, and asserts both converge.',
    technologies: ['Yjs / CRDT', 'Quill 2', 'Durable Objects', 'Cloudflare D1', 'Hono', 'WebSockets'],
    github: 'https://github.com/golba98/SyncroEdit',
    image: {
      src: '/shots/syncroedit.webp',
      alt: 'A SyncroEdit document open in the editor, under the ribbon: paragraphs typed by two accounts in the same room, and the document chat panel open beside them holding a message from each',
      caption: 'Screenshot of the app running locally.',
      width: 1680,
      height: 950,
    },
    active: true,
  },
  {
    id: 'ubume',
    title: 'Ubume',
    year: 'Apr 2026 — Current',
    role: 'Terminal UI for coding agents',
    summary:
      'One terminal for the Codex, Claude Code, Gemini, Mistral Vibe, and Antigravity CLIs, and for local models. History, workspace locks, TOML config, themes, and slash commands. TypeScript, Bun, Ink.',
    note: 'The other long project, on the same footing as SyncroEdit — kept alive and rebuilt as the tooling around it changes, rather than finished and shelved.',
    proof:
      'On npm as ubume, now v0.1.0 — renamed from @golba98/codexa, which shipped 27 releases from May to September 2026 (1.0.1 to 1.0.28). Six provider routes work — those five CLIs plus any OpenAI-compatible local server — with two Codexa Native runtimes held behind a dev build.',
    technologies: ['TypeScript', 'Bun', 'Ink', 'npm'],
    github: 'https://github.com/golba98/Ubume',
    npm: {
      name: 'ubume',
      version: '0.1.0',
      url: 'https://www.npmjs.com/package/ubume',
      install: 'npm install -g ubume',
    },
    startupScreen: {
      full: ubumeStartup,
      compact: ubumeStartupCompact,
      caption:
        'Recreated from the Ubume v0.1.0 source — logo from logoVariants.ts, layout from timelineMeasure.ts, composer from BottomComposer.tsx. Not a screenshot.',
    },
    active: true,
  },
  {
    id: 'movies',
    title: 'Fedora Movies',
    year: 'Jul 2026',
    role: 'Account-based streaming client',
    summary:
      "A private movie and TV library you sign into. Browse what's trending, search the catalogue, open a title for its details and trailer, and save the ones you want later. Accounts are issued by an admin, and a group can watch something together in a synced room.",
    note: 'Not a product for the public. It was built for my family, so we get private, secure movie viewing at home — which also means real people using something I maintain, close enough that I can watch for problems and fix them before anyone has a bad evening with it.',
    proof:
      'The TMDB token stays server-side behind an authenticated Worker proxy. First sign-in forces a password change; admins can revoke sessions, and every action lands in an audit log. Playwright tests cover Chromium, Firefox, Android, iPhone, and iPad. Hosts no media.',
    technologies: ['React 19', 'TypeScript', 'Cloudflare Workers', 'D1', 'Playwright'],
    github: 'https://github.com/golba98/Movie_App',
    image: {
      src: '/shots/fedora-movies.webp',
      alt: 'The Fedora Movies home screen: a featured title across the top and a row of trending film posters below it',
      caption: 'Screenshot of the app running locally.',
      width: 1920,
      height: 1387,
    },
    active: false,
  },
  {
    id: 'game',
    title: 'Forest RPG',
    year: 'Nov 2025 — Aug 2026',
    role: 'Top-down RPG engine, written from scratch',
    summary:
      'A browser game that builds its own world — forest, rivers, hills, weather, and a day that turns into night. You walk a character through it, fight what lives there, collect what it drops, and save a world you liked so you can come back to it.',
    proof:
      "Terrain comes from Perlin noise, hills from noise run through cellular-automata smoothing, and rivers from a walker that starts at a map edge and is jittered along its path by more noise, widening and branching as it goes. A BFS from the spawn point then prunes whatever the water cut off, and a second pass bridges any barrier that still blocks the route. PixiJS 7.4.3 draws the world with p5 1.6.0 layered over it for HUD and input; sixteen tests under Node's built-in runner cover the map server and the runtime contracts. It runs four ways — Node server, Live Server, Docker, or Cloudflare Workers static assets — and save/load is deliberately off on the deployed build, which has no server to save to.",
    technologies: ['JavaScript', 'p5.js', 'PixiJS', 'Node.js', 'Docker', 'Cloudflare Workers'],
    github: 'https://github.com/golba98/Game_Development',
    image: {
      src: '/shots/game.webp',
      alt: 'A generated Forest RPG world: a bridge crossing the river that cuts the map in two, sand banks along its edge, a mob tagged with its health bar and distance, and the health, stamina, gold, objective, minimap and XP panels around the edge of the screen',
      caption: 'Screenshot of the game running locally.',
      width: 1680,
      height: 950,
    },
    active: false,
  },
  {
    id: 'llm',
    title: 'Codexa v1',
    year: 'Jul 2026 — Current',
    role: '934M-parameter transformer, trained from scratch',
    summary:
      'A 24-layer decoder-only transformer built from scratch in Python and PyTorch, with a 16,384-token BPE tokenizer, memory-mapped data pipeline, mixed-precision training, and native conversational SFT.',
    note: 'Named after Codexa, the terminal UI now called Ubume — it is the model Ubume is meant to run on its own rather than routing out to someone else\'s CLI.',
    proof:
      'The base run completed 10,000 optimizer steps and 655,360,000 tokens on CUDA with bf16 and AdamW8bit. Conversational SFT v2 then completed 6,000 steps and 103,459,920 tokens, reaching 1.5768 training loss and 2.0316 validation loss.',
    technologies: ['PyTorch', 'Python', 'bf16', 'BPE tokenizer', 'CUDA'],
    github: 'https://github.com/golba98/LLM-Codexa-v1',
    active: true,
  },
];

/** From the CV's Projects section. No public repos are linked for these. */
export const earlierProjects: readonly EarlierProject[] = [
  { title: 'GeoQuest 3D', description: 'Developed a 3D geo-guesser style game with interactive exploration.' },
  { title: 'RugbyMate', description: 'Built an event-management program used for a school rugby tournament.' },
  { title: 'TryPOS', description: 'Created a functional point-of-sale (POS) system tailored for school event stalls.' },
  { title: 'BinCalc', description: 'Designed a binary calculator for HP Prime featuring user-friendly menus.' },
  {
    title: 'FileFlow',
    description: 'Built utility apps (file organizers, study tools, automation scripts) to improve workflow efficiency.',
  },
  { title: 'EduTool', description: 'Experimented with small educational apps that simplify math and programming concepts.' },
  { title: 'GameOpt', description: 'Worked on optimizing gaming setups, focusing on latency, scaling, and performance.' },
];

export function findProject(id: string): Project | undefined {
  return projects.find((project) => project.id === id);
}
