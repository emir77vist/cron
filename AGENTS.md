# AGENTS.md — Cron

Operating instructions for AI agents and humans working on **Cron**.
Read this before writing any UI, layout, or data-layer code.

---

## What is Cron?

Cron is a premium, monochrome personal career OS — job tracking, pipeline
metrics, and workflow tooling. The product surface is calm, spacious, and
deliberately restrained. Inspiration: Grok / xAI and SpaceX marketing sites
(dark canvas, white type, hairline structure, zero chrome noise).

---

## Stack

| Layer | Choice |
|-------|--------|
| Build | Vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Primitives | shadcn/ui (Radix) for behavior-heavy components |
| Icons | lucide-react |
| State | Zustand |
| Font | Geist Variable |

**Rule of split responsibility**

- **shadcn/ui** → behavior-heavy primitives only: Command, Dialog, Popover,
  Table, Tooltip, Dropdown Menu, Sheet, Scroll Area, Input, Badge, Separator.
- **Hand-styled Tailwind** → dashboard chrome, sidebar, page shells, cards,
  metric tiles, empty states, and any surface where pixel control matters.

Do not rebuild Dialog/Command from scratch. Do not let shadcn themes drive
the overall look — Cron tokens override everything.

---

## Design Law (non-negotiable)

### Palette — strict monochrome

| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#0A0A0A` | App background |
| Surface | `#141414` | Cards, panels, elevated regions |
| Surface raised | `#1A1A1A` | Nested cards, hover fills, active nav |
| Hairline | `#2A2A2A` | Borders, dividers, input edges |
| Text primary | `#FFFFFF` | Headings, primary labels, active items |
| Text secondary | `#888888` | Supporting copy, inactive nav, placeholders |
| Text meta | `#555555` | Timestamps, counts, keyboard hints, captions |

Mapped CSS variables live in `src/index.css` (`--cron-*` and shadcn token overrides).

### Forbidden

- **NO colored accents** — not blue, not green, not red status chips. Status
  is expressed with weight, opacity, border, or monochrome badges only.
- **NO glassmorphism** — no `backdrop-blur`, no translucent frosted panels.
- **NO gradients** — no linear/radial color ramps on UI chrome (the only
  allowed gradient is the tiny radial used for the dot-matrix background).
- **NO drop shadows** as primary depth — depth comes from surface steps
  (`#0A` → `#14` → `#1A`) and hairline borders.
- **NO busy patterns** — one subtle dot-matrix background, nothing else.

### Layout & density

- Generous whitespace. Prefer calm empty space over packed grids.
- Excellent hierarchy: one clear primary action per region; secondary
  actions quieter (`#888` / hairline buttons).
- Sidebar + main content. Content area has breathing room (`p-6`–`p-10`
  depending on density of the view).
- Radius is restrained (`0.5rem` base). Prefer sharp-ish, modern edges.

### Background

Apply the utility class `dot-matrix` on the app shell / canvas:

```css
/* Already defined in index.css */
.dot-matrix {
  background-color: #0A0A0A;
  background-image: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.04) 0.5px,
    transparent 0.5px
  );
  background-size: 16px 16px;
}
```

### Logo

- Asset: `public/logo.png` — clean white **Cron** wordmark.
- Render large and prominent. **No background box. No tagline. No icon
  mark next to it unless explicitly added later.**
- In the expanded sidebar: wordmark is the brand. Collapsed: use a compact
  “C” monogram or the mark only.

### Typography

- Font: Geist Variable (loaded via `@fontsource-variable/geist`).
- Primary text: white, medium–semibold for titles.
- Secondary: `#888`. Meta: `#555`.
- Avoid decorative fonts. Tracking slightly tight on large titles is fine;
  body stays neutral.

### Motion

- Prefer subtle, short transitions (`150–200ms`, ease-out).
- Sidebar collapse, command palette open, hover states — restrained.
- Respect `prefers-reduced-motion` when adding non-essential motion.

---

## App shell requirements

### Left sidebar

- Collapsible to icons (rail mode).
- Expanded width ~240px; collapsed ~64px.
- Hairline right border (`#2A2A2A`).
- Canvas background (same as app or one step raised — stay monochrome).
- Nav items: icon + label expanded; icon-only collapsed (tooltip on hover).
- Active item: raised surface (`#1A1A1A`) + white text. Inactive: `#888`.
- Logo at top. Collapse control at bottom or near logo.
- Keyboard: optional `[` / `]` or a dedicated toggle; also via Command palette.

### Command palette (Cmd+K / Ctrl+K)

- Built with shadcn `Command` + `Dialog`.
- Global shortcut: `⌘K` / `Ctrl+K`.
- Monochrome styling only (popover surface, hairline, white/gray text).
- Groups: Navigation, Actions, Jobs (when data exists).
- Esc closes. Click-outside closes.

### Main layout

```
┌──────────┬─────────────────────────────┐
│          │                             │
│ Sidebar  │  Main content (scrollable)  │
│          │                             │
│  logo    │  page header + body         │
│  nav     │                             │
│  footer  │                             │
│          │                             │
└──────────┴─────────────────────────────┘
```

- Full viewport height. Sidebar fixed; main scrolls independently.
- Dot-matrix on the outer shell / main canvas as appropriate.

---

## Folder structure

```
src/
  components/
    layout/          # AppShell, Sidebar, CommandPalette — chrome only
    shared/          # Reusable hand-styled pieces (PageHeader, EmptyState…)
    ui/              # shadcn primitives (do not hand-restyle freely)
  features/          # Feature modules (job-hub, dashboard, …) — added later
  hooks/             # Shared React hooks
  lib/
    data/            # Data-access layer (CRUD facades over store / API)
    metrics/         # deriveMetrics and pure metric helpers
    utils.ts         # cn() and shared utils
  stores/            # Zustand stores
  types/             # Domain TypeScript types
  App.tsx
  main.tsx
  index.css
public/
  logo.png           # White Cron wordmark
```

### Conventions

- Feature code lives under `src/features/<feature>/` once features land.
- Domain types in `src/types/` — not next to components.
- Data access goes through `src/lib/data/*`. UI components never talk to
  storage directly; they call store actions or data helpers.
- Prefer named exports. Keep files focused and small.

---

## State & data layer

### Zustand store (`src/stores/app-store.ts`)

Holds:

- UI shell state: `sidebarCollapsed`, `commandPaletteOpen`, `activeRoute`
- Domain entities (seed empty / stub): jobs, applications, companies, notes
- Actions to mutate shell + entities
- Hydration / reset helpers as needed

### Data access (`src/lib/data/`)

Thin facade functions used by features:

- `getJobs`, `getJobById`, `upsertJob`, `deleteJob`, …
- Same pattern for applications, companies, notes

Today these read/write the Zustand store. Tomorrow they can swap to an API
without changing feature components.

### Metrics (`src/lib/metrics/deriveMetrics.ts`)

Pure function. Input: current entities. Output: `AppMetrics` (counts,
pipeline stages, response rates, etc.). **Stub first** — return zeros /
empty structure until real logic is implemented.

Never compute metrics ad-hoc inside components. Always go through
`deriveMetrics`.

---

## TypeScript

- Strict domain types in `src/types/`.
- Prefer `type` aliases for plain objects; unions for status enums.
- Status values are string unions (e.g. `ApplicationStatus`) — **display
  them monochrome**, never map to traffic-light colors.
- IDs are branded or plain `string` (UUID-style). Consistency > cleverness.

---

## Component rules

1. **Chrome is hand-styled.** Sidebar, shell, page headers: Tailwind classes
   using Cron tokens (`bg-canvas`, `bg-surface`, `border-hairline`,
   `text-text-secondary`, etc. via theme aliases or arbitrary values matching
   the palette).
2. **Primitives stay shadcn.** Import from `@/components/ui/*`. Override via
   `className` when needed; do not fork files unless necessary.
3. **No color prop sprawl.** If you feel the urge to add a green “success”
   badge — stop. Use outline/weight/label instead.
4. **Accessibility:** keyboard first for palette and sidebar; aria labels on
   icon-only controls; focus rings use monochrome ring token.

---

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc + production build
npm run preview   # preview production build
npm run lint      # oxlint
```

---

## What is intentionally out of scope (foundation)

These land in subsequent steps — do not invent full UIs for them yet:

- Job Hub feature views
- Dashboard charts / metric tiles (beyond shell placeholder)
- Auth, backend, persistence beyond in-memory Zustand
- Settings pages, onboarding, multi-user

Foundation deliverables: design tokens, AGENTS.md, types, store + data
access + metrics stub, sidebar, command palette, app shell layout.

---

## Checklist before shipping UI

- [ ] Only monochrome palette used?
- [ ] No gradients / glass / colored accents?
- [ ] Dot-matrix present on canvas?
- [ ] Logo is white wordmark only, large, no extra text?
- [ ] Sidebar collapses to icons?
- [ ] Cmd+K opens command palette?
- [ ] Types + store + data layer used (no ad-hoc local entity bags)?
- [ ] shadcn for behavior, hand Tailwind for chrome?
