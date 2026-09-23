import type { SkillGroup } from '../types/content';

/**
 * From the previous site's toolkit: every item was checked against a manifest
 * or source file in a repo before it went in.
 */
export const toolkitSection = {
  eyebrow: 'Toolkit',
  heading: 'What I work with',
} as const;

export const skillGroups: readonly SkillGroup[] = [
  { label: 'Languages', items: ['Python', 'JavaScript', 'TypeScript', 'C++', 'SQL', 'Bash'] },
  {
    label: 'Frontend',
    items: ['React 19', 'Next.js', 'React Router', 'Tailwind CSS', 'Vite', 'p5.js', 'PixiJS', 'Quill', 'Yjs / CRDT'],
  },
  {
    label: 'Backend & cloud',
    items: [
      'Cloudflare Workers',
      'Pages Functions',
      'Durable Objects',
      'D1',
      'Workers AI',
      'Wrangler',
      'Hono',
      'Node.js',
      'Bun',
      'Express',
      'FastAPI',
      'Supabase',
    ],
  },
  { label: 'Testing & quality', items: ['Playwright', 'Vitest', 'Jest', 'node:test', 'ESLint', 'Prettier', 'axe-core'] },
  {
    label: 'AI & ML',
    items: [
      'PyTorch',
      'NumPy',
      'CuPy',
      'CUDA',
      'Hugging Face tokenizers',
      'safetensors',
      'faster-whisper',
      'whisper.cpp',
      'Ollama',
      'LM Studio',
      'MCP',
    ],
  },
  {
    label: 'Systems & tooling',
    items: ['Linux / Fedora', 'Docker', 'Git', 'CMake', 'Electron', 'PipeWire', 'AppImage / RPM', 'Cloudflare Pages', 'Vercel'],
  },
];

/** The CV's Technical Skills section, kept as written there. */
export const cvSkillGroups: readonly SkillGroup[] = [
  { label: 'Languages', items: ['Python', 'Java', 'C# (intro)', 'C++ (intro)', 'JavaScript', 'SQL', 'PHP'] },
  { label: 'Tools', items: ['Git', 'Docker', 'Linux', 'VS Code', 'Unity', 'Unreal Engine', 'GitHub', 'Anti-Gravity'] },
  { label: 'Web', items: ['HTML', 'CSS', 'React', 'Node.js'] },
  { label: 'Other', items: ['Cybersecurity basics', 'Game Development', 'Database design', 'AI/ML interest'] },
  {
    label: 'LLMS Experience',
    items: [
      'ChatGPT Codex 5.3',
      'Gemini 3.1 Pro',
      'Claude 3.5 Sonnet',
      'Ollama',
      'LM Studio',
      'Hugging Face TRL',
      'ASUS Multi-LM Tuner',
      'VS Code',
    ],
  },
];
