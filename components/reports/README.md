# The reporting surface

Notes for adding to `app/reports`. Short on inventory, long on the things that
were got wrong once already — most of what follows exists because something
drifted and nobody noticed until it was eleven copies deep.

Several of these rules are enforced by tests. A guard failing is not the guard
being fussy; each one is a regression that shipped.

## Colour

**Never write a palette step.** No `text-gray-500`, no `bg-slate-800`, no
`dark:` twin beside it. Use `bg-card`, `bg-muted`, `text-foreground`,
`text-muted-foreground`, `border-border` — they carry their own dark values, so
dark mode stops being something maintained by hand on every element.

*Guard: `__tests__/neutral-tokens.test.ts`.*

**Status hues are exempt and stay literal.** Emerald means "up", amber means
"look at this", red means "wrong". They carry meaning rather than describing a
surface, and they keep their own dark steps.

**Emerald is the accent, and only ever marks interactive state** — the active
filter, the current nav item, the primary action. `bg-primary/10 text-primary`.
There were once eight spellings of "this is selected"; now there is one.

**Per-game colour comes from the backend**, via `GAME_STATS_REGISTRY.color` /
`.color_dark` on the API payload — never from `--chart-N`. A game keeps its hue
everywhere it appears, which a positional palette cannot promise: filter a chart
and a positional palette repaints the survivors.

`chartTheme(isDark).series` is for charts with **no game dimension** (new vs
returning, funnel stages). Those five are validated as a set — OKLCH lightness
band, chroma floor, adjacent-pair separation under deutan/protan/tritan
simulation, contrast against the surface. Do not add a sixth by eye; run
`validate_palette.js` from the dataviz skill.

Two findings worth keeping:

- The **dark lightness band is *below* the light band**. "Brighten it for dark
  mode" is wrong, and it pushed amber and emerald out of band.
- **A one-hue ramp cannot colour three bars on a light surface.** Its pale end
  falls under 3:1 against the background, so the steps crowd into the dark half
  — the funnel's last two ended up 0.064 apart in luminance and unreadable. Use
  distinct hues when the bars are distinct *measures*; position already carries
  the order.

*Guard: `lib/__tests__/chart-theme.test.ts` — also fails if `chart-theme.ts`
drifts from `globals.css`, since recharts needs literal hex and the palette
therefore lives in two places.*

## Where things live

```
primitives/  building blocks that know nothing about a game except by prop
filters/     controls that narrow what a report shows
charts/      anything that draws data as a shape
panels/      a question answered — usually a card with a table or chart in it
shell/       the section's own chrome
```

The split is the answer to "is there already something for this", which used to
need prior knowledge. If a new piece does not obviously belong in one of these,
that is worth a moment's thought before adding a sixth.

## Structure

| Need | Use | Not |
|---|---|---|
| A table | `ReportTable` / `ReportHead` / `ReportRow` / `Th` / `Td` | `<table>` |
| A figure in a card | `StatTile` | a local `Tile`/`Stat` |
| Several figures in **one** card | `StatFigure` | `StatTile` (nests a card in a card) |
| Nothing to show | `EmptyState` | a centred muted `<p>` |
| Loading / error / retry | `ReportPanel` | branching on `error`/`isLoading` yourself |
| Filters | `FilterBar` + `FilterGroup` | a bare flex row |
| A share across ordered bands | `Distribution` | printing counts as a sentence |
| A withheld number | `SmallSampleNotice` | a bare dash |
| Figures inside a panel | `MetricRow` | a hand-built `<dl>` or `<div>` grid |
| A group of panels on a page | `SectionHeader` | a bare `<h2>`, or nothing |

`Distribution` sizes its bars from the raw counts, never the rounded shares:
rounding each band on its own is right for the label and wrong for the geometry,
where three bands at 33.3% leave a visible gap. `SmallSampleNotice` states the
count *and* the threshold — "too few" invites "how few?", and a bare dash reads
as zero.

`Th`/`Td` take `align` as a **prop**, because alignment is a property of the
data — numbers right, labels left — so the reader's eye lands in the same place
in every table. As a className it was a per-table decision and three tables
disagreed.

`ReportPanel` matters for behaviour, not just tidiness. Branching at page level
means one slow endpoint blanks panels that have already loaded, and one failing
endpoint replaces panels that are fine. It also keeps the previous numbers on
screen during a refetch instead of flashing to grey.

## Writing

**An empty panel is not a place to say nothing.** It has the reader's full
attention and nothing competing for it. Say what is missing in their terms
("No favourites were added in this window"), and what would change it if
anything would — usually a wider range. "No data yet" tells them only what they
already worked out from the blank panel.

**Every number that can be misread needs a glossary entry** in the backend's
`core/reporting/metrics.py`, wired up with `<MetricInfo metric="key" />`. The
bar is not "what does this count" but "how would someone read this wrong":
distinct players are not additive, a swept game's median is its sweeper's clock,
an unfinished pool ranked by rate buries the game worth working on.

## The traps

- **Codemods orphan things.** Deleting a `dark:` twin whose light partner has no
  mapping leaves the light value rendering on a dark surface. Check what is
  *left over*, not just what changed.
- **Codemod output can be invalid rather than wrong.** `bg-gray-50/50` became
  `bg-muted/50/50`; Tailwind emits nothing for it, so four panels silently lost
  their tint.
- **Surface tokens describe surfaces.** An overlay on a coloured background is
  not one — `hover:bg-white/10` on the green topbar is correct, and `bg-card/10`
  inverts it in dark mode.
- **Some files are CRLF.** Edit them with tooling that preserves line endings; a
  Python `read_text`/`write_text` round-trip turns a 48-line change into a
  1,143-line diff.
- **`lint-staged` runs `eslint --fix` over whole staged files.** A one-line edit
  to a file carrying lint debt drags all of it along, so clear the debt in its
  own commit first.
