# Grid dashboard: progress log

Spec: `docs/superpowers/specs/2026-10-17-grid-dashboard-design.md`. Owner asked (2026-10-17) to work autonomously and nonstop; a session cron nudges every ~45 min.

## Steps

- [x] Spec written
- [x] Plan: kept to the spec's delivery order (bounded steps; one review per step)
- [x] 1. BE: sessions endpoint, filters, MP inclusion, variation pools — App#2248 merged + deployed by hand 2026-10-17 (prod: 47–85 ms per split)
- [ ] 2. FE: collapsible ReportPanel, /games/grid, redirects, Grid duplicate removals (automation_et PR)
- [ ] 3a. FE: remove anomalies page + nav
- [ ] 3b. BE: remove anomalies endpoint
- [ ] 4. Project 2 spec (all games, merged nav)

## Rules carried from memory

Merge one PR at a time, watch deploy green before the next. One test run at a time on the dev stack. 1–3 tests per fix. Reviewer agents after each part. Screenshots go in an Artifact. PRs carry "Test steps — only if you want to", "Same pattern elsewhere", "Blast radius". CRLF-preserving edits.

## UX review notes for project 2

(collect cross-game findings here as they come up)

## Log

- 2026-10-17: BE deploys are manual on the box (`sudo extratime-deploy`), no GHA minutes. Full BE suite: 3 pre-existing failures on production, filed App#2246 (agent-ok) and App#2247.
- Deviation from spec: Players tiles are players / D7 / top player / MP share (no 'new players'; top players has no solo/MP columns) — needs BE, park for project 2.
