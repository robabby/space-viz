# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
```

## Architecture

Local disk space visualization tool. Next.js 16 app with a server-side filesystem scanner and two client-side chart views.

### Data flow

1. User enters a path (or picks via folder browser) → client state
2. `GET /api/scan?path=...&depth=...` recursively walks the filesystem, returns a `FileNode` tree
3. Page renders either `SunburstChart` (D3) or `TreemapChart` (Recharts)
4. Clicking a chart segment drills down via breadcrumb state — no re-fetch, just navigates the existing tree

### Key files

- **`src/app/page.tsx`** — Main UI, all client state (path, depth, viewMode, breadcrumbs, scan result). Orchestrates scan, navigation, and chart switching.
- **`src/app/api/scan/route.ts`** — Core scanner. Handles APFS firmlink deduplication, sparse file detection (`stat.blocks * 512`), hidden file flagging, and item collapsing (>20 → "other" bucket).
- **`src/app/api/browse/route.ts`** — Lists subdirectories for the folder picker modal.
- **`src/app/api/reveal/route.ts`** — macOS-only: runs `open -R` to reveal in Finder.
- **`src/components/sunburst-chart.tsx`** — D3 partition layout rendered as raw SVG. Manual DOM manipulation, not React-managed SVG.
- **`src/components/treemap-chart.tsx`** — Recharts `<Treemap>` with custom `CustomContent` renderer.
- **`src/components/folder-browser.tsx`** — Modal directory picker, fetches `/api/browse`.

### Shared types (`src/lib/types.ts`)

`FileNode` is the central data structure: `{ name, size, path, hidden?, children? }`. Returned by the scan API and consumed by both charts and the contents table.

## Conventions

- All pages/components are client components (`"use client"`), layout is server-only
- Styling uses Tailwind CSS 4 with custom CSS variables defined in `globals.css` via `@theme`
- Color palette: dark theme only, teal accent scale (`--color-teal-1` through `--color-teal-5`) on charcoal backgrounds (`--color-void`, `--color-hull`, `--color-panel`, `--color-ridge`)
- Two font families: JetBrains Mono (`--font-display`) for data/UI, IBM Plex Sans (`--font-body`) for body text
- Icons: Lucide React throughout

## macOS-specific behavior

- Scanner skips APFS firmlink volumes under `/System/Volumes` to avoid double-counting
- Hidden detection: dot-prefix + `~/Library` (UF_HIDDEN flag, detected by path heuristic rather than shelling out)
- Reveal in Finder uses `open -R`
- File sizes use `stat.blocks * 512` for actual disk usage (sparse file aware)
