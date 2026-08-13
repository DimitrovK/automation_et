# Reports backlog

The working list for the reporting section. Reviewed at the start of every session
so nothing is silently dropped.

**Status key** — `TODO` not started · `WIP` in progress · `DONE` merged · `?` needs a
decision from Kalin before it can be built.

Items marked **[K]** came from Kalin's review on 2026-08-13. Items marked **[C]** are
ones I found while verifying that list or building the reports.

---

## A. Broken or misleading — fix first

| # | Item | Notes | Status |
|---|---|---|---|
| A1 | **[K]** Player rows on `/reports/players` aren't clickable | The drill-down at `/reports/players/[id]` exists and works — nothing links to it. Verified: no `Link` in the table. | TODO |
| A2 | **[K]** Chart text is white-on-white in dark mode | Recharts axis/legend/tooltip text doesn't follow the theme. Affects every chart page. | TODO |
| A3 | **[K]** Heatmap colours are too close to read | A single-hue ramp can't separate many active cells. Needs re-derivation with the validator, likely more steps or a different scale. | TODO |
| A4 | **[C]** Scout reports **100.0% completion** over 942 sessions | No game has zero abandonment. Almost certainly `is_finished` set at session start. Corrupts every completion comparison until fixed. | TODO |
| A5 | **[C]** Conquest median session is **exactly 1,440.4 min** (24h) | A timeout artifact, not play. Makes the duration report misleading for the one campaign game. | TODO |
| A6 | **[C]** Avatar of Football median session is **0.3 min** (18s) | Either genuinely trivial or the duration measurement is wrong. Needs a decision either way. | TODO |

## B. Missing capability Kalin asked for

| # | Item | Notes | Status |
|---|---|---|---|
| B1 | **[K]** Reports card on the dashboard (`/`) | Reports is in the sidebar but has no dashboard card. Wants a card that opens a chooser for next actions — "like User Hub but better". | TODO |
| B2 | **[K]** Range presets: Today, Yesterday, etc. | Currently 7/10/15/30/60/90 + custom. Needs relative presets — and the API's `ALLOWED_WINDOWS` may need widening for 1-day. | TODO |
| B3 | **[K]** Compare two arbitrary periods | Today it only compares against the immediately preceding window. Wants A-vs-B with both chosen. BE + FE. | TODO |
| B4 | **[K]** Multiplayer games missing from "played" on Players | The players view counts solo sessions; MP participations aren't represented per player. BE work. | TODO |
| B5 | **[K]** Show 25/50/100 should be a dropdown | Currently three buttons. Trivial, but part of the wider control-consistency pass (D1). | TODO |
| B6 | **[K]** Metric toggle is single-select | Played / Finished / Players / Multiplayer — only one at a time. Wants multi-select, or a design that actually makes sense (they're different units, so overlaying naively would mislead). | TODO |

## C. Reports that need to be better, not just present

| # | Item | Notes | Status |
|---|---|---|---|
| C1 | **[K]** Retention is weak | Wants materially better visibility into how players are retained. Currently window-based cohorts with a flagged first row. Likely needs per-game retention curves, cohort sizes, and a clearer "is this good or bad" frame. | TODO |
| C2 | **[K]** Session length needs real depth | Wants: when sessions are abandoned, when they're typically finished, distribution rather than a single median. Currently one median + flags. | TODO |
| C3 | **[K]** Games page needs more interesting information | Currently a comparison table. Candidates: per-game funnel, retention, time-of-day skew, trend sparkline. | TODO |
| C4 | **[C]** Surface the biggest lever on the platform | missing11 is 25.9% of all play at 61.7% completion — the single largest pool of abandonment (~3,232 sessions). The reports contain this but don't say it. | TODO |
| C5 | **[C]** Reach vs depth is invisible | Quiz: 227 players × 7.2 sessions. Team Ties: 77 × 38.6. Opposite problems, no view makes the contrast obvious. | TODO |

## D. UI quality pass (use the `frontend-design` plugin)

| # | Item | Notes | Status |
|---|---|---|---|
| D1 | **[K]** "The UI of almost all pages is not the best" | Full design pass: hierarchy, spacing, typography, control consistency, empty states, loading states. Should be done as a system, not page by page. | TODO |
| D2 | **[K]** Game labels read "Avatar Of Football **Game Sessions**" | BE registry labels are admin-dashboard card titles. Needs a short `display_name` on `GameStatsSpec` exposed via `game_metadata()` — not FE string-stripping. Also fixes "CareerPath" / "MissingTeam" spacing. | TODO |
| D3 | **[K]** "Needs attention" shouldn't live in the Daily Pulse | Wants it out of the Pulse. Needs a decision on where it goes — its own page, the dashboard card, or an indicator. | ? |

## E. Needs a decision before I build

| # | Item | Notes | Status |
|---|---|---|---|
| E1 | **[K]** "Bots should be excluded by default" | **Verified: they already are** — `includeBots: false` on every page. Need to know what was actually seen: the toggle's appearance, Anonymous (user 2, deliberately kept), or a specific page. | ? |
| E2 | **[C]** Which of the nine report pages are actually used | Some may be worth removing rather than improving. | ? |
| E3 | **[C]** `package-lock.json` tracked alongside `pnpm-lock.yaml` | Only pnpm is authoritative on Vercel. Drift guard is in place; deleting one is the real fix, and it changes local install. | ? |

---

## Done this session

Foundation, analysis, interpretation, reach and reliability — 54 PRs (App #1425–#1450,
automation_et #31–#58). Includes three production faults: the player-detail request
loop, the pnpm lockfile drift that stopped deploys, and UTC-vs-local "today" that
emptied leaderboards nightly across 11 games.
