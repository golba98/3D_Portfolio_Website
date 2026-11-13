import type { EarlierProject, Project, TerminalScreen } from '../types/content';

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

// Verified against public source on 2026-11-13.
export const projectsSection = { eyebrow: 'Work', heading: 'What I built', lede: 'Eight projects across tools, systems, collaboration and research.' } as const;

export const projects: readonly Project[] = [
  {
    id: "hp-prime-emulator",
    title: "HP Prime Emulator",
    year: "In development",
    role: "Rust PPL engine, IDE and debugger",
    summary: "Write, check, debug and run HP Prime PPL programs on a desktop, with a native execution engine that needs neither a calculator nor firmware files.",
    proof: "A Rust workspace separates syntax, compilation, the VM, graphics and device integration. The egui IDE exposes paused variables and stack frames; the CLI can execute programs and export the 320×240 framebuffer. Compatibility suites and debugger tests exercise the native implementation.",
    technologies: [
      "Rust",
      "egui",
      "Bytecode VM",
      "PPL",
      "HID"
    ],
    github: "https://github.com/golba98/hp-prime-emulator",
    note: "An independent, unofficial implementation. Native execution does not provide CAS, built-in calculator apps or full firmware parity. The optional Linux firmware backend requires separately supplied firmware.",
    active: true
  },
  {
    id: "hp-prime-toolkit",
    title: "HP Prime Development Toolkit",
    year: "In development",
    role: "Standalone PPL development tools",
    summary: "A terminal workflow for checking and running PPL, stepping through programs and inspecting what they draw.",
    proof: "The hpdev CLI builds on a pinned revision of the emulator’s native Rust engine. Statement-level debugging supports breakpoints and frame inspection; isolated worker processes enforce execution limits. Test manifests check results and image snapshots, with terminal, PNG and local browser framebuffer previews.",
    technologies: [
      "Rust",
      "CLI / TUI",
      "JSON reports",
      "Snapshot testing"
    ],
    github: "https://github.com/golba98/hp-prime-development-toolkit",
    note: "Buildable from source. Public npm packages and native releases have not been published. It shares the native engine’s compatibility limits and is not a general-purpose security sandbox.",
    active: true
  },
  {
    id: "syncroedit",
    title: "SyncroEdit",
    year: "In development",
    role: "Real-time collaborative editor",
    summary: "A document workspace where people edit together, see each other’s presence and discuss the document in a chat panel.",
    proof: "Yjs CRDT updates travel over WebSockets through Cloudflare Durable Objects. Hono serves the Worker API, D1 stores application data, and Quill provides rich-text editing. The repository includes unit, integration, frontend and Playwright collaboration tests, plus tooling for deliberate release promotion.",
    technologies: [
      "Yjs",
      "Quill 2",
      "Hono",
      "Durable Objects",
      "Cloudflare D1",
      "WebSockets"
    ],
    github: "https://github.com/golba98/SyncroEdit",
    note: "A deployed application under continued development. The public repository holds production application source and release tooling.",
    active: true,
    image: {
      src: "/shots/syncroedit.webp",
      alt: "SyncroEdit document editor with a chat panel",
      caption: "Earlier screenshot of the app running locally.",
      width: 1680,
      height: 950
    }
  },
  {
    id: "ubume",
    title: "Ubume",
    year: "In development",
    role: "Terminal workspace for coding agents",
    summary: "One stateful terminal UI for coding-agent CLIs and local OpenAI-compatible models, with planning, permissions, change review and session recovery.",
    proof: "TypeScript and Ink provide the interface, with Bun development and test tooling. Provider routes include Codex, Claude Code, Antigravity, Mistral Vibe, the Anthropic API and local models. Queued instructions, session browsing and diff/rewind workflows keep long-running work in one workspace.",
    technologies: [
      "TypeScript",
      "Bun",
      "Ink",
      "Node.js"
    ],
    github: "https://github.com/golba98/Ubume-CLI",
    note: "Published as ubume; provider availability depends on the corresponding CLI, credentials or local server. Development continues.",
    active: true,
    startupScreen: { full: ubumeStartup, compact: ubumeStartupCompact, caption: 'Historical illustration recreated from Ubume v0.1.0 source. Not a screenshot of the current release.' },
    npm: {
      name: "ubume",
      version: "0.1.18",
      url: "https://www.npmjs.com/package/ubume",
      install: "npm install -g ubume"
    }
  },
  {
    id: "llm",
    title: "Codexa v3",
    year: "In development",
    role: "249M-parameter language-model research",
    summary: "A decoder-only Transformer built and trained from random initialization in PyTorch, including its tokenizer pipeline, training loop, checkpoint recovery and generation code.",
    proof: "The model uses RMSNorm, rotary positions, SwiGLU and tied embeddings. A completed base run processed 500,006,912 targets; CPU fixtures test training and recovery without requiring the full model or a GPU. Architecture and measured results below refer specifically to v3.",
    technologies: [
      "Python",
      "PyTorch",
      "CUDA / BF16",
      "BPE",
      "RMSNorm / RoPE"
    ],
    github: "https://github.com/golba98/Codexa-LLM-v3-PyTorch-250M",
    note: "Research software: the baseline still repeats itself and produces factual errors and incoherent responses. Mathematics training admission remains pending; no public trained weights are available.",
    active: true
  },
  {
    id: "game",
    title: "Forest RPG v2",
    year: "In development",
    role: "Procedural TypeScript browser RPG",
    summary: "Explore a seeded world of forests, meadows, highlands, wetlands and autumn woodland, fight enemies and carry a saved adventure between sessions.",
    proof: "PixiJS 8 renders streamed terrain, rivers, bridges and walkable hills. Combat, progression, weather and day/night systems share a persistent world with explored-map memory. Local saves support file import/export. Vitest and Playwright suites cover world generation and gameplay.",
    technologies: [
      "TypeScript",
      "PixiJS 8",
      "Vite",
      "Vitest",
      "Playwright"
    ],
    github: "https://github.com/golba98/Forest-RPG-v2",
    note: "Playable from a local build and still evolving. Saves live in the browser; exporting them provides a separate copy.",
    active: true
  },
  {
    id: "mygui",
    title: "MyGUI",
    year: "In development",
    role: "C++20 GUI library",
    summary: "A small native GUI library with layouts, wrapped text, images, scrolling, editable fields, anchored popups and reusable modal dialogs.",
    proof: "GLFW handles windows and input; OpenGL 3.3 and FreeType render widgets and text. The library owns widget trees and exports a CMake package. Tests cover input, layout, dialogs and rendering, with Linux renderer checks under Xvfb/Mesa.",
    technologies: [
      "C++20",
      "GLFW",
      "OpenGL 3.3",
      "FreeType",
      "CMake"
    ],
    github: "https://github.com/golba98/MyGUI",
    note: "Linux rendering is tested; Windows and macOS CI cover builds and headless tests. Complex-script shaping, multiline editing and native accessibility integration are not implemented.",
    active: true
  },
  {
    id: "http-server",
    title: "HTTP Server",
    year: "In development",
    role: "C++23 HTTP/1.1 server",
    summary: "An HTTP server built around an incremental request parser, a bounded worker pool and a static-file service.",
    proof: "The parser is independent of socket I/O and rejects ambiguous request framing. Linux openat2 confines file access to the document root; poll/eventfd support timeouts and shutdown. Catch2 tests, sanitizers and libFuzzer targets exercise parsing and server behavior.",
    technologies: [
      "C++23",
      "Linux sockets",
      "CMake",
      "Catch2",
      "libFuzzer"
    ],
    github: "https://github.com/golba98/HTTP-Server",
    note: "A working systems project with deliberate limits: numeric IPv4 listening, no TLS, and no Range or conditional-request support. Intended for learning and experimentation.",
    active: true
  }
];

/** Previous public versions followed by older CV projects. */
export const earlierProjects: readonly EarlierProject[] = [
  { title: 'Forest RPG v1', description: 'Earlier JavaScript/p5.js procedural RPG with a local Node map server. Superseded by the TypeScript v2 game.', github: 'https://github.com/golba98/Game_Development' },
  { title: 'Codexa v1', description: 'Earlier PyTorch model workspace covering architecture, tokenization, training and inference. Its training results are separate from v3.', github: 'https://github.com/golba98/Codexa-LLM-v1-PyTorch' },
  { title: 'Codexa NumPy v2', description: 'A separate experiment with a NumPy tensor/autograd engine and optional CuPy backend; memory and specialist modules remain placeholders.', github: 'https://github.com/golba98/Codexa-LLM-v2-NumPy' },
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
