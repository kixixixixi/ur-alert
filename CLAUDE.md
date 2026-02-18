# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ur-alert** is a UR rental property monitoring system for Tokyo. It fetches property listings from the UR API daily, detects changes (new/removed/rent changes), sends Slack alerts for matching properties, and displays a filterable frontend on GitHub Pages.

## Commands

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm build        # Build static site to /out
pnpm lint         # Run ESLint
pnpm format       # Run Prettier (writes in place)
pnpm typecheck    # Type-check without emitting

# Data pipeline scripts (run manually or via GitHub Actions)
pnpm fetch:ur     # Fetch latest UR data from API
pnpm diff:ur      # Calculate diff from previous snapshot
pnpm notify:ur    # Send Slack notifications for matching items
```

## Architecture

### Data Flow

GitHub Actions runs daily at 9:00 JST:
1. `scripts/fetch.ts` → hits UR API, saves `data/snapshots/YYYY-MM-DD.json` + `data/latest.json`
2. `scripts/diff.ts` → compares two most recent snapshots, saves `data/diff.json`
3. `scripts/notify.ts` → filters diff results, POSTs to `SLACK_WEBHOOK_URL`
4. Data files are committed and pushed to `main`
5. `deploy.yml` triggers on push, builds Next.js static export, deploys to GitHub Pages

### Key Files

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Server component; reads `data/latest.json` and `data/diff.json` at build time |
| `components/PropertyList.tsx` | Client component; manages filter state, computes available layouts/areas |
| `components/PropertyCard.tsx` | Displays a property with optional "NEW" badge |
| `components/Filters.tsx` | Filter UI (rent range, layout checkboxes, area checkboxes) |
| `scripts/types.ts` | Shared `UrItem` type used across scripts and frontend |
| `data/latest.json` | Current day's full property list (committed to repo) |
| `data/diff.json` | Daily diff with `new_item_ids` array (used by frontend for NEW badges) |
| `data/snapshots/` | Immutable daily snapshots, never overwritten |

### Unique Key

Properties are identified by `unitId = bukkenNo + ":" + roomNo`. This composite key drives deduplication in `fetch.ts` and change detection in `diff.ts`.

### Next.js Configuration

- `output: "export"` — static site generation only (no server-side runtime)
- `basePath: "/ur-alert"` in production (GitHub Pages subdirectory)
- All filtering is client-side in `PropertyList.tsx` (useMemo)

### Notify Filter Criteria (hardcoded in `scripts/notify.ts`)

Slack alerts are sent only for **new** items matching:
- `rent < 150,000`
- `layout` in `["2LDK", "3K", "3DK", "3LDK", "4K", "4DK", "4LDK", ...]`
- `floorspace >= 50`

### Code Style

Prettier is configured with: no semicolons, double quotes disabled (single quotes), 2-space indent, trailing commas (es5). Run `pnpm format` before committing.
