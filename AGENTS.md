# AGENTS.md - Space Viz

## Build & Run Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server with Turbopack (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
```

## Code Style Guidelines

### TypeScript & Imports
- Use `"use client"` directive at top of all client components
- Server components (page, layout, API routes) omit `"use client"`
- Import from `"@/lib/*"` for internal modules
- Order: React → external → internal → types
- Prefer `import type` for type-only imports

### Formatting
- 2-space indentation
- Single quotes for strings
- Semicolons at end of statements
- Max 100 chars per line; break after `=` in object literals
- No trailing commas in JSX

### Naming Conventions
- Components: PascalCase (`FileNodeTree`, `SunburstChart`)
- Functions: camelCase (`formatBytes`, `scanDirectory`)
- Constants/sets: UPPER_SNAKE_CASE with `const`
- API route handlers: `GET`, `POST`, `PUT`, etc.
- File paths use `camelCase` (e.g., `sunburst-chart.tsx`)

### Error Handling
- API routes: return `NextResponse.json({ error, status })`
- Catch filesystem errors silently with `try/catch { continue }`
- Validate inputs early; return 400 for invalid paths

### Tailwind CSS
- Use CSS variables from `globals.css` (e.g., `--color-teal-3`)
- Tailwind classes only; no inline styles unless dynamic
- Utility pattern: `hover:bg-[var(--color-ridge)]`

### FileNode Structure
```typescript
interface FileNode {
  name: string;
  size: number;           // bytes (stat.blocks * 512 for sparse files)
  path: string;
  children?: FileNode[];
  hidden?: boolean;       // dot-prefix or macOS UF_HIDDEN
}
```

### API Routes
- Next.js 16 App Router: `app/api/*` with `GET`, `POST` handlers
- Query params via `request.nextUrl.searchParams.get()`
- Use `path.resolve()` for path normalization
- macOS-specific: skip APFS firmlink volumes under `/System/Volumes`

### macOS-Specific Behavior
- Skip `/System/Volumes/Data`, `BaseSystem`, etc. to avoid double-counting
- Detect hidden dirs: dot-prefix + `~/Library` (UF_HIDDEN flag)
- Reveal in Finder: `open -R "${filePath}"`

### Scanning Rules
- Ignore: `node_modules`, `.git`, `.next`, `.DS_Store`, `__pycache__`, etc.
- Collapse >20 children into "other" bucket (top 15 + combined rest)
- Report actual disk usage via `stat.blocks * 512`

## Project Structure
```
src/
  app/
    page.tsx              # Main UI with scan results & charts
    layout.tsx            # Root layout
    globals.css           # Tailwind + CSS variables
    api/
      scan/route.ts       # Filesystem scanner
      browse/route.ts     # Folder picker API
      reveal/route.ts     # macOS reveal in Finder
  components/
    sunburst-chart.tsx    # D3 partition tree
    treemap-chart.tsx     # Recharts treemap
    contents-table.tsx    # File list with size breakdown
    folder-browser.tsx    # Modal directory picker
  lib/
    types.ts              # FileNode interface
    format.ts             # formatBytes, formatPercent
```

## Color Palette (CSS Variables)
- Backgrounds: `--color-void`, `--color-hull`, `--color-panel`
- Accents: `--color-teal-1` through `--color-teal-5`
- Text: `--color-bright` (primary), `--color-dim` (secondary), `--color-muted` (tertiary)
- Borders: `--color-ridge`

## Testing
No test framework configured. Add Jest/Vitest + React Testing Library as needed.
