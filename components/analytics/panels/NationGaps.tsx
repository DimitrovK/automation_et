'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NationGapsResponse, NationRow } from '@/types/reports';
import { Check, ExternalLink, ShieldOff, UserRoundX } from 'lucide-react';
import Link from 'next/link';
import { NationCrest } from '@/components/analytics/NationCrest';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import config from '@/lib/config';
import { nationFootballersHref } from '@/lib/nation-param';
import { cn } from '@/lib/utils';

/**
 * One accent per gap, so the two cards are told apart before they are read.
 *
 * `chart-2` and `chart-3` rather than raw Tailwind colours: both are redefined
 * under `.dark` in `globals.css`, so this survives the theme switch. Written
 * out in full because Tailwind scans for literal class names — building
 * `bg-chart-${n}/10` would emit nothing and fail silently, which is the
 * failure the content globs in `tailwind.config.ts` are commented about.
 */
const ACCENTS = {
  amber: {
    tile: 'bg-chart-3/10 text-chart-3 ring-chart-3/20',
    figure: 'text-chart-3',
    chip: 'hover:border-chart-3/40 hover:bg-chart-3/5',
  },
  sky: {
    tile: 'bg-chart-2/10 text-chart-2 ring-chart-2/20',
    figure: 'text-chart-2',
    chip: 'hover:border-chart-2/40 hover:bg-chart-2/5',
  },
} as const;

const CHIP = 'inline-flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-sm transition-colors';

/**
 * Where a team for this nation can be created.
 *
 * The Django admin, and the only external link on the page. There is no
 * team-management screen in this app, so the alternative is a chip that names
 * a job with nowhere to do it.
 */
function addTeamHref(nationId: number) {
  return config.getAdminUrl(`FootballData/team/add/?nation=${nationId}`);
}

/** Flag, name, short code — the same identity in both lists. */
function NationChip({ row }: { row: NationRow }) {
  return (
    <>
      <NationCrest short={row.short} flag={row.flag} className="size-7 rounded-md" />
      <span className="font-medium text-foreground">{row.name}</span>
      {/* The code set apart rather than greyed: it is a different KIND of name,
          and it is what the table above prints under every row.

          Dropped when there is no flag, because then the crest has ALREADY
          fallen back to the code and the chip reads "TUV Tuvalu TUV". Three of
          233 active nations, so it is rare rather than never. */}
      {row.flag && (
        <span className="rounded bg-muted px-1 py-px font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
          {row.short}
        </span>
      )}
    </>
  );
}

/**
 * One gap: what it is, how big it is, and a sample you can act on.
 *
 * The count is the headline because the count is the signal — the backend caps
 * these lists on purpose and sends `total` alongside, since rows 40 to 101 of a
 * worklist are identical in kind. It used to be 12px grey text under the chips,
 * which is the wrong way round.
 */
function GapCard({ title, description, icon: Icon, accent, total, shown, emptyLabel, onExpand, expanded, children }: {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
  total: number;
  shown: number;
  emptyLabel: string;
  onExpand?: () => void;
  expanded?: boolean;
  children: ReactNode;
}) {
  const empty = total === 0;
  const tone = ACCENTS[accent];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex min-w-0 gap-3">
          <span
            aria-hidden
            className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', empty ? 'bg-primary/10 text-primary ring-primary/20' : tone.tile)}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        {/* Zero is the goal here, so it reads in the brand green rather than in
            the warning colour the other counts use. */}
        <div className="shrink-0 text-right">
          <p className={cn('text-2xl leading-none font-semibold tabular-nums', empty ? 'text-primary' : tone.figure)}>
            {total.toLocaleString()}
          </p>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">
            {total === 1 ? 'nation' : 'nations'}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {empty
          ? (
              // Not an error and not a blank: for a gap list, zero is the goal,
              // and a flat grey sentence reads like something failed to load.
              <p className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-muted-foreground ring-1 ring-primary/15 ring-inset">
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
                {emptyLabel}
              </p>
            )
          : (
              <CappedList
                total={total}
                shown={shown}
                onExpand={onExpand}
                expanded={expanded}
                // Unreachable — the zero case is handled above, where it can be
                // more than a sentence. Kept because the prop is required and
                // the two have to agree.
                emptyLabel={emptyLabel}
              >
                {children}
              </CappedList>
            )}
      </CardContent>
    </Card>
  );
}

/**
 * Nations nothing points at.
 *
 * Two gaps, kept apart because they are different jobs. A nation with no
 * footballers cannot appear in anything nation-scoped — no national-team clue,
 * no nation criterion. A nation with no teams cannot appear in club-based
 * content. They overlap heavily, and fixing one does not fix the other.
 *
 * Below the ranked table rather than above it: the table is what the page is
 * for, and two worklists at the top pushed it under the fold. These are the
 * follow-up — read the depth, then see what has none.
 *
 * Active nations only. A defunct country with no footballers is not a gap to
 * fill — mixing the two turns a worklist into a list nobody will action.
 */
export function NationGaps({ data, onExpand, expanded }: {
  data: NationGapsResponse;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GapCard
        title="Nations with no footballers"
        description="Nothing nation-scoped can use these — no national-team clue, no nation criterion."
        icon={UserRoundX}
        accent="amber"
        total={data.nations_without_footballers.total}
        shown={data.nations_without_footballers.items.length}
        onExpand={onExpand}
        expanded={expanded}
        emptyLabel="Every active nation has at least one footballer."
      >
        <ul className="flex flex-wrap gap-1.5">
          {data.nations_without_footballers.items.map(row => (
            <li key={row.short}>
              {/* Lands on an empty filtered list, which is the honest view
                  of the gap — and the Add form is on the same screen. */}
              <Link href={nationFootballersHref(row.id)} className={cn(CHIP, ACCENTS.amber.chip)}>
                <NationChip row={row} />
              </Link>
            </li>
          ))}
        </ul>
      </GapCard>

      <GapCard
        title="Nations with no teams"
        description="A separate gap: club-based content needs a team in the country, not just a player from it."
        icon={ShieldOff}
        accent="sky"
        total={data.nations_without_teams.total}
        shown={data.nations_without_teams.items.length}
        onExpand={onExpand}
        expanded={expanded}
        emptyLabel="Every active nation has at least one team."
      >
        <ul className="flex flex-wrap gap-1.5">
          {data.nations_without_teams.items.map(row => (
            <li key={row.short}>
              <a
                href={addTeamHref(row.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(CHIP, ACCENTS.sky.chip)}
              >
                <NationChip row={row} />
                {/* Marked, because it is the one link on the page that leaves
                    the app — an unannounced new tab reads as the page having
                    jumped somewhere on its own. */}
                <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="sr-only">(opens the Django admin in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </GapCard>
    </div>
  );
}
