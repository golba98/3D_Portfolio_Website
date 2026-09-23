import type { Repo } from '../types/content';
import { profile } from './profile';

export const reposSection = {
  eyebrow: 'Public code',
  heading: 'On GitHub',
  unreachable: 'GitHub is not reachable right now.',
  viewAll: 'View all repositories',
} as const;

/**
 * Descriptions from the previous site's repoBlurbs, in the order it listed
 * them. The GitHub API only adds language, stars and dates on top of these.
 */
const blurbs: ReadonlyArray<readonly [name: string, description: string]> = [
  ['SyncroEdit', 'Collaborative document workspace with in-document chat. Yjs CRDTs over WebSockets, coordinated by Cloudflare Durable Objects.'],
  ['Ubume', 'Ubume, a terminal UI for coding agents — the Codex, Claude Code, Gemini, Mistral Vibe, and Antigravity CLIs, and local models. Published on npm as ubume.'],
  ['LLM-Codexa-v1', 'A 934M-parameter decoder-only transformer trained from scratch in PyTorch, with native conversational SFT inference.'],
  ['Movie_App', 'Account-based movie and TV app. React 19 and a Cloudflare Worker proxying TMDB, with D1-backed accounts.'],
  ['Game_Development', 'Top-down RPG engine in p5.js and PixiJS. Perlin-noise terrain, carved rivers, cellular-automata hills, and a flood fill that checks the world is playable.'],
  ['Cue-Helper', 'Fedora-first desktop assistant driving already-authenticated coding CLIs, with local whisper.cpp transcription.'],
  ['Survey-App', 'Cloudflare Worker and D1 survey on South African cost of living, with Turnstile and no IP retention.'],
  ['CM1040-Survey-App-Final', 'Getting Online in South Africa, 2006-2026. CM1040 coursework: three chapters built from validated JSON with no framework or third-party runtime script, checked with Playwright, axe-core, and the Nu HTML validator.'],
  ['Data-Visualizer', 'A data story on South African inequality, built from WID.world, World Bank, and Stats SA figures.'],
  ['Data-Visualizer-', 'Earlier TypeScript pass at the inequality data story, kept for reference.'],
  ['Video-Transcriber', 'Local video and audio transcription GUI. FastAPI and faster-whisper, no paid APIs.'],
  ['Internship_Finder', 'Scrapes six South African job boards for CS internships and scores each listing against your profile.'],
  ['Snake-and-leader-cloudflare', 'Canvas arcade game in TypeScript — delta-time loop, high-DPI rendering, and a local leaderboard.'],
  ['Logical_Gate_Representation', "Educational tool for digital logic — verifies truth tables and demonstrates De Morgan's laws."],
  ['IT_Pixel_Generator', 'Pixel art and sprite generation tool written in Python.'],
  ['image_converter', 'Batch image format converter with a Python GUI.'],
  ['PNG-to-JPEG', 'Small utility for converting PNG images to JPEG.'],
  ['Truth_Table_Generator', 'Converts a logical expression into its full truth table.'],
  ['Base_Converter_Expression', 'Converts input between any two bases from 2 to 16.'],
  ['Cloud_ChatBot', "Chatbot running on Cloudflare's edge."],
  ['Drawing_Project', 'Browser drawing app with a canvas-based brush engine.'],
  ['weasel-sentence-simulator', "Implementation of Dawkins' weasel program — cumulative selection over random mutation."],
  ['Venn_Call', 'Adds Venn diagram visualisation to the HP Prime calculator.'],
  ['Karnaugh-Map-Generator-HP-Prime', 'Karnaugh map generator for the HP Prime calculator.'],
  ['hp-prime-ppl-python', 'Python tooling for HP Prime PPL programs.'],
  ['Aesthetic_Login', 'Styled desktop login interface built in Python.'],
  ['Transition-Personal-Website', 'Earlier iteration of this portfolio.'],
  ['Personal-Website-', 'Earlier iteration of this portfolio.'],
];

export const repos: readonly Repo[] = blurbs.map(([name, description]) => ({
  name,
  description,
  url: `${profile.github}/${name}`,
}));

export const repoDescriptions: ReadonlyMap<string, string> = new Map(blurbs);
