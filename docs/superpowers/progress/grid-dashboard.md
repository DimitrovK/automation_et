# Grid dashboard: progress log

Spec: `docs/superpowers/specs/2026-10-17-grid-dashboard-design.md`. Owner asked (2026-10-17) to work autonomously and nonstop; a session cron nudges every ~45 min.

## Steps

- [x] Spec written
- [x] Plan: kept to the spec's delivery order (bounded steps; one review per step)
- [x] 1. BE: sessions endpoint, filters, MP inclusion, variation pools — App#2248 merged + deployed by hand 2026-10-17 (prod: 47–85 ms per split)
- [x] 2. FE: /games/grid, PanelCard/Fold, redirects, removals — automation_et#185 merged, Vercel READY 2026-10-17 (also fixed useReport stale responses on every page)
- [x] 3a. FE: remove anomalies page + nav — automation_et#186, READY
- [x] 3b. BE: remove anomalies endpoint — App#2249, deployed by hand, endpoint 404 on prod
- [x] 4. Project 2 (Insights), spec `docs/superpowers/specs/2026-10-17-insights-design.md`:
  - [x] P1 one Insights nav/shell — automation_et#187
  - [x] P2 /games/<key> for every game + GAME_CONTENT registry — #188
  - [x] P3 fold the long pages, popularity chart removed — #189
  - [x] P4 consistency: Players 30d default, "Came back" label — this PR. Kept on purpose: Retention 60d (D30 needs it), Questions/Footballers 90d (volume), data pages no range
- [ ] Final adversarial review of the whole Insights surface; then notify the owner

## Rules carried from memory

Merge one PR at a time, watch deploy green before the next. One test run at a time on the dev stack. 1–3 tests per fix. Reviewer agents after each part. Screenshots go in an Artifact. PRs carry "Test steps — only if you want to", "Same pattern elsewhere", "Blast radius". CRLF-preserving edits.

## UX review notes for project 2

Audit done 2026-10-17 (read-only agent); its findings are folded into the project 2 spec.

## Log

- 2026-10-17: BE deploys are manual on the box (`sudo extratime-deploy`), no GHA minutes. Full BE suite: 3 pre-existing failures on production, filed App#2246 (agent-ok) and App#2247.
- Deviation from spec: Players tiles are players / D7 / top player / MP share (no 'new players'; top players has no solo/MP columns) — needs BE, park for project 2.
