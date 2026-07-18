# Cron

Premium monochrome career OS — jobs, goals, network, reflection, and focus.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui (behavior primitives)
- Zustand
- **Familjen Grotesk** type

## Design

Strict monochrome (`#0A0A0A` canvas, hairline borders, white type).  
Inspired by Grok / xAI and SpaceX. See **AGENTS.md** for the design law.

## Features

| Module | What |
|--------|------|
| **Dashboard** | KPIs from `deriveMetrics`, funnel, priorities |
| **Job Hub** | URL/text parser, pipeline, applications table |
| **Goals** | Yearly→daily cascade with roll-up progress |
| **Contacts** | Mini-CRM + CSV import with fuzzy match review |
| **Reflections** | Soft-lock weekly/monthly review + archives |
| **Pomodoro** | Sidebar focus timer (25/5) |
| **Intro** | Cursor-reactive particle scene → logo (skippable) |

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

Opening scene plays once per browser session (`sessionStorage`). Skip with **Esc** or the Skip control.

## Deploy

Live: **https://emir77vist.github.io/cron/**

Static site on GitHub Pages from the `gh-pages` branch.

```bash
GITHUB_PAGES=true npm run build
# then publish dist/ to gh-pages (see deploy history)
```
