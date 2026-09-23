# Jordan Vorster — portfolio

A 3D model of my desk (Blender → glTF) that the camera flies into; the centre
monitor becomes a simulated Fedora/GNOME-style desktop holding the portfolio.

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # typecheck + production build
npm run lint
```

## Structure

| Path | What lives there |
|---|---|
| `src/store/experience.ts` | The phase machine: `loading → intro → exploring → entering-monitor → desktop` (+ `fallback`) |
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

## Tuning the camera

In development, `?pose=introSide`, `?pose=presentation` or `?pose=monitorFocus`
holds the camera on that pose, and `?fallback` forces the no-3D fallback.
Both flags are stripped from production builds. Poses are in
`src/config/cameraPoses.ts` (desk space: metres, origin at the desk top centre).

## Hardware

`src/data/hardware.ts` only contains facts the previous site stated. Fill in the
`null` fields (CPU, GPU model, RAM, …) and they appear in System Info,
`neofetch` and `hardware`.
