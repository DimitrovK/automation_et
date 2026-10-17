# Grid dashboard: one page for health, content and players

Date: 2026-10-17 · Status: approved in chat (owner, 2026-10-17) · Repos: automation_et (FE), FootballExtraTime/App `api/` (BE)

## Why

Grid is spread over two admin pages that overlap and disagree:

- `/reports/games/grid` (generic `[key]` page) mixes solo and multiplayer sessions.
- `/analytics/grid` is solo-only, yet shows a reporting strip (solo + MP) next to solo-only mode completion.
- No admin surface splits Grid by country board, Classic/Reversed (`variation_mode` HOME/ABROAD) or Instant/Final Whistle (`reveal`), though the model stores all three.
- Cards are always fully open, so the pages are long walls of tables.

The owner wants one place to answer three questions without getting lost: **is Grid healthy, is the content good, who plays it.**

## Scope

Project 1 (this spec): the Grid page, the shared collapsible card, removal of the cross-game "Needs attention" page.
Project 2 (next spec): apply the template to every game and merge the Reports / Analytics navigation into one section. Its starting point is the UX review logged in `docs/superpowers/progress/grid-dashboard.md`.

## Page: `/games/grid`

`/reports/games/grid` and `/analytics/grid` redirect here (query string preserved). Other games keep their current pages until project 2.

### Filter bar (top, sticky)

Range (existing `RangePicker`, default 30d) · **Play type** All / Solo / Multiplayer · **Board** All / Standard / each country board · **Country mode** All / Classic / Reversed (labels from `GridSettings`; only shown when a country board, or All boards, is selected) · **Timing** All / Instant / Final Whistle. All in the URL.

Rule: every card follows the filter bar. A card that cannot (stock, retention) says which filters it ignores in its header.

### Section 1: Health

- Tiles: sessions, players, completion, multiplayer share; each vs the previous period.
- **Sessions over time**: Recharts AreaChart styled like `CatalogueGrowth` (overlaid translucent areas, legend). A **Split by** switch: Play type · Board · Country mode · Timing · Difficulty. Day / week / month buckets.
- Collapsed by default: time-of-day profile, session length.

### Section 2: Content

Each card is collapsed by default and shows a one-line headline while closed.

| Card | Change |
|---|---|
| Modes & boards | Merges Modes + Popularity. Group by mode (difficulty × roster × size) / board / country mode / timing / play type. |
| Criteria | Merges Criteria + Criterion types + Teams into tabs. |
| Footballers | Same card, filtered. |
| Help used | Same card, filtered. |
| Grid stock | Adds country-board pools (today default pools only). Not filtered by date. |

### Section 3: Players

Tiles (players, new players, D7 retention, MP players), Retention card, Top players with solo / MP columns. Retention ignores board/mode/timing (per-player measure), stated in its header.

## Collapsible cards

`ReportPanel` gains `collapsible`, `defaultOpen`, `summary` (headline shown while closed) and a stable `id`. Open state is remembered per card id in `localStorage` (try/catch; falls back to `defaultOpen`). Being on the shared primitive, project 2 inherits it everywhere.

## Backend

- New `GET core/analytics/grid/sessions/`: `{tiles, previous, series: [{date, total, <split value>: n}], split, splits_available, range echo}`. Params: range, granularity, `split`, plus the four filters. Counts from `Grid.GameSession` directly (the rollup has no Grid dimensions). Admin-only via `_ReportingBase`.
- `core/analytics/grid/` accepts `play_type`, `board` (`standard` | variation id), `variation_mode`, `reveal`. Multiplayer is included when play type allows it (today always excluded by `solo_q()`); default `all`.
- Modes table group-by options computed in `grid_modes`.
- `grid_pools` includes variation pools.
- Drop the unused `mode` echo from the `analytics/grid` response.
- Remove `reporting/anomalies/`, `ReportingAnomaliesView`, `detect_anomalies` and their tests.

## Removed (FE)

`/reports/anomalies` page + nav entries, `AnomalyPanel`, `AnomalySensitivity`, `GridBehaviourStrip`, `GridPopularity` (folded into Modes), the size-based Grid difficulty usage, the legacy "retired variations keys" test.

## Order of delivery (each merged and deployed before the next)

1. BE: sessions endpoint + filters + MP inclusion + variation pools (additive, old FE keeps working).
2. FE: collapsible `ReportPanel`, `/games/grid`, redirects, removals of Grid duplicates.
3. FE: remove anomalies page and nav. Then BE: remove anomalies endpoint.
4. Project 2 spec.

## Testing

Few, targeted, fail-before: split counts per dimension, MP inclusion/exclusion by play type, `analytics/grid` filters, variation pools in stock. FE: collapsible panel open/closed/remembered, Split-by switch renders one area per value. Existing guards (`no-orphaned-components`, `response-fields-used`, `SectionNav`, admin-only view discovery) stay green.
