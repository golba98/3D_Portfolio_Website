import type { EarlierProject, Project } from '../types/content';
import { ubumeStartup, ubumeStartupCompact } from './ubumeScreen';

// Verified against public source on 2026-11-13.
export const projectsSection = {
  eyebrow: 'Work',
  heading: 'What I built',
  lede: 'Tools for writing code, apps for working together, and experiments in how software works. Pick a project to see what it does and how I built it.',
} as const;

export const projects: readonly Project[] = [
  {
    id: 'hp-prime-emulator',
    title: 'HP Prime Emulator',
    role: 'A calculator programming workspace',
    category: 'Developer tools',
    highlights: [
      'Write calculator programs in a desktop editor without connecting an HP Prime.',
      'Pause a running program to inspect its variables and follow function calls.',
      'Preview the calculator screen and export the graphics your program draws.',
    ],
    summary:
      'A desktop workspace for PPL, the programming language used by HP Prime calculators. Write and run programs, find mistakes and see their graphics without needing the physical calculator or its firmware.',
    proof:
      'A Rust workspace separates syntax, compilation, the VM, graphics and device integration. The egui IDE exposes paused variables and stack frames; the CLI can execute programs and export the 320×240 framebuffer. Compatibility suites and debugger tests exercise the native implementation.',
    technologies: ['Rust', 'egui', 'Bytecode VM', 'PPL', 'HID'],
    github: 'https://github.com/golba98/hp-prime-emulator',
    note: 'An independent, unofficial implementation. Native execution does not provide CAS, built-in calculator apps or full firmware parity. The optional Linux firmware backend requires separately supplied firmware.',
  },
  {
    id: 'hp-prime-toolkit',
    title: 'HP Prime Development Toolkit',
    role: 'Calculator development from the terminal',
    category: 'Developer tools',
    highlights: [
      'Check and run HP Prime programs with the hpdev command-line tool.',
      'Step through a program and inspect its output without opening the desktop IDE.',
      'Compare results and screen snapshots in repeatable automated tests.',
    ],
    summary:
      'The command-line companion to the HP Prime Emulator. It brings the same calculator programming engine into terminal workflows, so programs can be checked, debugged and tested automatically.',
    proof:
      'The hpdev CLI builds on a pinned revision of the emulator’s native Rust engine. Statement-level debugging supports breakpoints and frame inspection; isolated worker processes enforce execution limits. Test manifests check results and image snapshots, with terminal, PNG and local browser framebuffer previews.',
    technologies: ['Rust', 'CLI / TUI', 'JSON reports', 'Snapshot testing'],
    github: 'https://github.com/golba98/hp-prime-development-toolkit',
    note: 'Buildable from source. Public npm packages and native releases have not been published. It shares the native engine’s compatibility limits and is not a general-purpose security sandbox.',
  },
  {
    id: 'syncroedit',
    title: 'SyncroEdit',
    role: 'Write and collaborate in real time',
    category: 'Web apps',
    highlights: [
      'Edit a shared rich-text document while other people are working in it.',
      'See who is present and discuss changes in the document’s chat panel.',
      'Keep concurrent edits in sync through a shared document service.',
    ],
    summary:
      'A document workspace where people edit together, see each other’s presence and discuss the document in a chat panel.',
    proof:
      'Yjs CRDT updates travel over WebSockets through Cloudflare Durable Objects. Hono serves the Worker API, D1 stores application data, and Quill provides rich-text editing. The repository includes unit, integration, frontend and Playwright collaboration tests, plus tooling for deliberate release promotion.',
    technologies: ['Yjs', 'Quill 2', 'Hono', 'Durable Objects', 'Cloudflare D1', 'WebSockets'],
    github: 'https://github.com/golba98/SyncroEdit',
    note: 'A deployed application under continued development. The public repository holds production application source and release tooling.',
    image: {
      src: '/shots/syncroedit.webp',
      alt: 'SyncroEdit document editor with a chat panel',
      caption: 'Earlier screenshot of the app running locally.',
      width: 1680,
      height: 950,
    },
  },
  {
    id: 'ubume',
    title: 'Ubume',
    role: 'One terminal for your coding agents',
    category: 'Developer tools',
    highlights: [
      'Work with coding-agent CLIs or a local model from one terminal workspace.',
      'Queue instructions, review code changes and control tool permissions.',
      'Return to earlier sessions and recover the context of longer tasks.',
    ],
    summary:
      'A terminal workspace that brings different AI coding tools into one place. Plan work, give instructions, review the changes and pick up a previous session without rebuilding your context each time.',
    proof:
      'TypeScript and Ink provide the interface, with Bun development and test tooling. Provider routes include Codex, Claude Code, Antigravity, Mistral Vibe, the Anthropic API and local models. Queued instructions, session browsing and diff/rewind workflows keep long-running work in one workspace.',
    technologies: ['TypeScript', 'Bun', 'Ink', 'Node.js'],
    github: 'https://github.com/golba98/Ubume-CLI',
    note: 'Published as ubume; provider availability depends on the corresponding CLI, credentials or local server. Development continues.',
    startupScreen: {
      full: ubumeStartup,
      compact: ubumeStartupCompact,
      caption: 'Historical illustration recreated from Ubume v0.1.0 source. Not a screenshot of the current release.',
    },
    npm: {
      name: 'ubume',
      version: '0.1.18',
      url: 'https://www.npmjs.com/package/ubume',
      install: 'npm install -g ubume',
    },
  },
  {
    id: 'llm',
    title: 'Codexa v3',
    role: 'Building a language model from scratch',
    category: 'Research',
    highlights: [
      'Train a 249-million-parameter Transformer starting from random weights.',
      'Follow the pipeline from tokenized text to training, checkpoints and generation.',
      'Inspect recorded measurements and test recovery with small CPU fixtures.',
    ],
    summary:
      'A language model built and trained from scratch in Python and PyTorch. The project follows the whole process: turning text into tokens, training the model, saving progress and generating text.',
    proof:
      'The model uses RMSNorm, rotary positions, SwiGLU and tied embeddings. A completed base run processed 500,006,912 targets; CPU fixtures test training and recovery without requiring the full model or a GPU. Architecture and measured results below refer specifically to v3.',
    technologies: ['Python', 'PyTorch', 'CUDA / BF16', 'BPE', 'RMSNorm / RoPE'],
    github: 'https://github.com/golba98/Codexa-LLM-v3-PyTorch-250M',
    note: 'Research software: the baseline still repeats itself and produces factual errors and incoherent responses. Mathematics training admission remains pending; no public trained weights are available.',
  },
  {
    id: 'game',
    title: 'Forest RPG v2',
    role: 'A persistent, procedurally generated adventure',
    category: 'Games',
    highlights: [
      'Explore five kinds of terrain in a world generated from a repeatable seed.',
      'Fight enemies and progress through changing weather and day/night cycles.',
      'Return to your saved world or export a save file to keep a separate copy.',
    ],
    summary:
      'Explore a seeded world of forests, meadows, highlands, wetlands and autumn woodland, fight enemies and carry a saved adventure between sessions.',
    proof:
      'PixiJS 8 renders streamed terrain, rivers, bridges and walkable hills. Combat, progression, weather and day/night systems share a persistent world with explored-map memory. Local saves support file import/export. Vitest and Playwright suites cover world generation and gameplay.',
    technologies: ['TypeScript', 'PixiJS 8', 'Vite', 'Vitest', 'Playwright'],
    github: 'https://github.com/golba98/Forest-RPG-v2',
    note: 'Playable from a local build and still evolving. Saves live in the browser; exporting them provides a separate copy.',
  },
  {
    id: 'mygui',
    title: 'MyGUI',
    role: 'Native interfaces built in C++',
    category: 'Systems',
    highlights: [
      'Compose windows from reusable layouts, labels, images and editable fields.',
      'Add scrolling, anchored popups and modal dialogs to a native application.',
      'Integrate the library through CMake and test layout, input and rendering.',
    ],
    summary:
      'A small native GUI library with layouts, wrapped text, images, scrolling, editable fields, anchored popups and reusable modal dialogs.',
    proof:
      'GLFW handles windows and input; OpenGL 3.3 and FreeType render widgets and text. The library owns widget trees and exports a CMake package. Tests cover input, layout, dialogs and rendering, with Linux renderer checks under Xvfb/Mesa.',
    technologies: ['C++20', 'GLFW', 'OpenGL 3.3', 'FreeType', 'CMake'],
    github: 'https://github.com/golba98/MyGUI',
    note: 'Linux rendering is tested; Windows and macOS CI cover builds and headless tests. Complex-script shaping, multiline editing and native accessibility integration are not implemented.',
  },
  {
    id: 'http-server',
    title: 'HTTP Server',
    role: 'A web server built in C++',
    category: 'Systems',
    highlights: [
      'Serve static files using an HTTP/1.1 server written in C++23.',
      'Parse requests incrementally and reject ambiguous message boundaries.',
      'Explore bounded worker threads, request timeouts and controlled shutdown.',
    ],
    summary:
      'A web server that receives HTTP requests and sends back files. Built in C++23, it brings request parsing, connection handling and file access together without a web framework.',
    proof:
      'The parser is independent of socket I/O and rejects ambiguous request framing. Linux openat2 confines file access to the document root; poll/eventfd support timeouts and shutdown. Catch2 tests, sanitizers and libFuzzer targets exercise parsing and server behavior.',
    technologies: ['C++23', 'Linux sockets', 'CMake', 'Catch2', 'libFuzzer'],
    github: 'https://github.com/golba98/HTTP-Server',
    note: 'A working systems project with deliberate limits: numeric IPv4 listening, no TLS, and no Range or conditional-request support. Intended for learning and experimentation.',
  },
];

/** Previous public versions followed by older CV projects. */
export const earlierProjects: readonly EarlierProject[] = [
  {
    title: 'Forest RPG v1',
    description:
      'Earlier JavaScript/p5.js procedural RPG with a local Node map server. Superseded by the TypeScript v2 game.',
    github: 'https://github.com/golba98/Game_Development',
  },
  {
    title: 'Codexa v1',
    description:
      'Earlier PyTorch model workspace covering architecture, tokenization, training and inference. Its training results are separate from v3.',
    github: 'https://github.com/golba98/Codexa-LLM-v1-PyTorch',
  },
  {
    title: 'Codexa NumPy v2',
    description:
      'A separate experiment with a NumPy tensor/autograd engine and optional CuPy backend; memory and specialist modules remain placeholders.',
    github: 'https://github.com/golba98/Codexa-LLM-v2-NumPy',
  },
  { title: 'GeoQuest 3D', description: 'Developed a 3D geo-guesser style game with interactive exploration.' },
  { title: 'RugbyMate', description: 'Built an event-management program used for a school rugby tournament.' },
  { title: 'TryPOS', description: 'Created a functional point-of-sale (POS) system tailored for school event stalls.' },
  { title: 'BinCalc', description: 'Designed a binary calculator for HP Prime featuring user-friendly menus.' },
  {
    title: 'FileFlow',
    description:
      'Built utility apps (file organizers, study tools, automation scripts) to improve workflow efficiency.',
  },
  {
    title: 'EduTool',
    description: 'Experimented with small educational apps that simplify math and programming concepts.',
  },
  {
    title: 'GameOpt',
    description: 'Worked on optimizing gaming setups, focusing on latency, scaling, and performance.',
  },
];

export function findProject(id: string): Project | undefined {
  return projects.find((project) => project.id === id);
}
