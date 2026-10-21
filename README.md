# Jordan Vorster — portfolio

A 3D model of my desk (Blender → glTF). Visitors approach the desk, pull out the
chair, and can draw on the whiteboard before entering the centre monitor. The
monitor becomes a simulated Fedora/GNOME-style desktop holding the portfolio.
On a phone, visitors go into the iPhone on the desk instead, which becomes an
iOS-style phone holding the same apps.

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # typecheck + production build
npm run lint
```

## Deployment and security

The current deployment uses Cloudflare Workers static assets, configured in
`wrangler.jsonc`. Build with `npm ci && npm run build`; the output is `dist`.
For Cloudflare Pages, use build command `npm run build` and output directory
`dist`. Deploy only the build output, never the repository or `assets-src`.

`public/_headers` is copied into the build and supplies CSP, framing and MIME
protections, referrer and permissions policies, and HSTS. The CSP allows inline
styles for React/Framer Motion, embedded fonts, blob textures, and WebAssembly
for the 3D model decoder. GitHub's public API is the only external connection.
Vite preview does not apply Cloudflare's `_headers` rules.

In Cloudflare's dashboard, select `jordanvorsterwebsite.online`, then **SSL/TLS →
Edge Certificates → Always Use HTTPS** and enable it. HSTS does not replace the
HTTP redirect for first-time visitors. After deployment, verify that HTTP
requests redirect to HTTPS while preserving paths and queries, and that HTTPS
responses include the headers in `_headers`.

Before a release, run `npm run lint`, `npm run build`, `npm run model:check`, and
`npm audit`. Check the desktop, phone interface, 3D scene, and CV download on the
deployed site. When replacing the public CV, purge its URL from Cloudflare's
cache and verify the downloaded PDF contains no phone number. Older versions
remain accessible in public Git history; replacing the file does not erase them.

Keep credentials out of `public/` and frontend code: everything in the built
site is public, including any Vite `VITE_*` environment variables used by code.

## Structure

| Path | What lives there |
|---|---|
| `src/store/experience.ts` | The phase machine: `loading → intro → exploring → entering-monitor → desktop`, with a whiteboard view and fallback |
| `src/store/boardDrawing.ts` | Whiteboard strokes, tools, undo, and browser-local saving |
| `src/config/` | Every tunable number: camera poses, timings, lighting, DPR, model node names |
| `src/components/scene/` | The 3D world (R3F). Loaded lazily; `#/desktop` links never download three.js |
| `src/components/desktop/` | Top bar, dock, overview, window manager, mobile shell |
| `src/apps/` | About, Projects, Terminal, Files, System Info, Contact (registered in `apps/registry.ts`) |
| `src/data/` | All portfolio content, typed. Migrated from the previous site and CV |

## Updating the 3D model

The Blender project is never modified. To use a new export:

1. Export `PC_Setup_Hero.glb` from Blender.
2. Copy it to `assets-src/pc-setup-source.glb`.
3. `npm run model:optimize` → writes `public/models/pc-setup.glb` (meshopt + WebP).
4. `npm run model:check` → confirms the nodes the site needs still exist and prints bounds.

The export needs the named `Chair`, `Whiteboard_Surface`, and `Whiteboard_Tray`
nodes. The drawing surface is positioned from the board mesh at runtime. Visitors
can draw with a pointer or use the focusable keyboard drawing area (arrow keys
to move, Enter to start or stop). Sketches are kept in that browser's local
storage and can be cleared from the board toolbar.

## Tuning the camera

In development, `?pose=introSide`, `?pose=presentation` or `?pose=monitorFocus`
holds the camera on that pose, and `?fallback` forces the no-3D fallback.
Both flags are stripped from production builds. Poses are in
`src/config/cameraPoses.ts` (desk space: metres, origin at the desk top centre).

## Hardware

`src/data/hardware.ts` contains hardware facts from the previous site and owner
confirmations. Fill in the
`null` fields (CPU, GPU model, RAM, …) and they appear in System Info,
`neofetch` and `hardware`.

The keyboard is a Keychron K2 HE Black, confirmed by the owner. Its 3D model
matches the supplied photographs: black case and keycaps, red backlighting,
and a left-side USB cable.

## Credits

- Linux desktop wallpaper: black abstract wallpaper supplied by the owner as
  `tester1.png` on 2026-10-15; original authorship unspecified — `public/wallpaper.webp`.
  The same image is embedded in all three monitors in the Blender export and
  used by the website's live monitor preview and Linux desktop.
- Phone wallpapers: iPhone 15 Pro "Black Titanium" (Home Screen and Lock Screen
  variants), © Apple, via iClarified — `public/wallpaper-iphone.webp`,
  `public/wallpaper-iphone-lock.webp`.
- App icons: see `public/icons/apps/README.md`.
