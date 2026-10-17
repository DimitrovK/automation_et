# Insights: one section instead of Reports and Analytics

Date: 2026-10-17 · Status: owner asked to proceed autonomously ("make it a real app/dashboard someone can use without getting lost") · Follows `2026-10-17-grid-dashboard-design.md` (Grid is the template).

## Problem (from the read-only audit, 2026-10-17)

- Two sections answer overlapping questions. Both have a "Per game" group holding different things; a game's numbers live in up to three places (`/reports/games/[key]`, a content page under Analytics, rows in the cross-game cards on `/reports/games`).
- Six games (quiz, conquest, team_ties, scout, missing_team, tenable) are reachable only through a badge inside a table. Quiz's content page (`/analytics/football-data/questions`) is not tied to Quiz at all.
- Pages are walls of open cards: `/reports/games` has 12, Footballers 7, Questions 6. Nothing but Grid folds.
- Defaults differ for no reader reason: 7 / 30 / 60 / 90 days. SurfaceTabs drop the URL filters and jump 30 → 90 days.
- One page, two names ("Football data" vs "Overview"); one metric, several names (`games_started` = Played / Sessions / Games started; repeat rate = Came back / Repeat rate / Repeat %).
- Panels the code itself calls noise or redundant: the daily pulse tiles (a day is noise at this volume), New vs returning (GrowthFlow answers it better), PopularityBars on Games (repeats the table's Played column), the one-card Football data overview (its call duplicates Footballers').

## Shape

One nav section, **Insights**, with one shell. Routes stay where they are unless a page moves (fewer redirects, bookmarks keep working).

```
Insights
├─ Overview          /reports                weekly pulse, activity, growth, games table (rows link to the game)
├─ Games             /reports/games          compare every game; cross-game cards folded
│  └─ <each game>    /games/<key>            Health · Content · Players (Grid's template)
├─ Players           /reports/players        top players → /reports/players/<id>
├─ Retention         /reports/retention
├─ Multiplayer       /reports/multiplayer
├─ Football data     /analytics/football-data/footballers (absorbs the overview) · nations · teams · questions
└─ What the numbers mean (glossary, trailing)
```

## Per-game pages: `/games/<key>`

- Every registry game gets one page with Grid's sections and one filter bar (range + bots; game-specific facets later). Grid keeps its bespoke page (its static route wins over `[key]`).
- **Health:** the four tiles (sessions, completion, came back, share) against the previous period; the activity chart; folded "When and how long" (hour profile, session length).
- **Content:** the game's own rows of the cross-game cards (difficulty outcomes, attempts, progress drop-off, content stock, unfinished), then the game's dedicated content cards from a declarative registry (`lib/game-content.ts`: key → cards). Career Path: mode volume, mode rates, footballer worklist, difficulty tiers. Missing 11: slots, workload. Quiz: question quality, category quality, question bank, quiz usage. Conquest: format fallbacks. A game with no entry shows only the shared rows.
- **Players:** came-back tile, folded retention, top players.
- Redirects: `/reports/games/<key>` → `/games/<key>`, `/analytics/career-path` → `/games/career_path`, `/analytics/lineups` → `/games/missing11`. SurfaceTabs go away.
- A game switcher at the top of the page (all registry games, by display name) replaces "find the badge in a table".

## Cards

- Every card on Insights pages folds (PanelCard, or Fold around cards that draw their own frame). The first card of each section is open; the rest show a one-line headline.
- Defaults: 30 days on every behaviour and per-game page; data pages (nations, teams, footballers' catalogue) take no range.
- Labels from one table (`lib/metric-labels.ts`): Sessions, Completion, Came back, Share, Players, Typical session.

## Removed

Daily pulse tiles (weekly stays), New vs returning, PopularityBars on Games, the one-card Football data overview (folded into Footballers; its URL redirects), SurfaceTabs and `CONTENT_ANALYTICS_BY_GAME`.

## Phases (each its own PR, merged and deployed before the next)

1. **Nav:** one Insights nav and shell, quick links updated, Football data overview folded into Footballers.
2. **Per-game template:** `/games/[key]`, the content registry, game switcher, redirects, SurfaceTabs removed.
3. **Fold everything:** Games, Overview, Footballers, Questions and the rest on PanelCard/Fold; the removals above.
4. **Consistency:** default ranges, metric labels.

## Not in scope

New backend metrics (new players, solo/MP columns on top players), visual redesign of individual charts, the public website.

## Testing

Guards stay green (`SectionNav` coverage, `no-orphaned-components`, `response-fields-used`). Per phase: 1–3 tests for new logic (the content registry resolves every registry game; redirects table), browser check on dev data with screenshots in a proof page.
