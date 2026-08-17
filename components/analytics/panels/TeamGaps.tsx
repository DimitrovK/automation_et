'use client';

import type { TeamGapRow, TeamGapsResponse } from '@/types/reports';
import Link from 'next/link';
import { NationFlag } from '@/components/analytics/NationFlag';
import { TeamCrest } from '@/components/analytics/TeamCrest';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHIP = 'inline-flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-sm ring-1 ring-inset ring-border transition-colors hover:bg-muted';

/** The chip's contents, which are the same whether or not it can be clicked. */
function Gap({ row }: { row: TeamGapRow }) {
  return (
    <>
      <TeamCrest name={row.name} badge={row.badge ?? null} className="size-6 rounded" />
      <span className="font-medium text-foreground">{row.name}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <NationFlag flag={row.flag} />
        {/* Not `null` — a team with no nation is its own small gap. */}
        {row.nation ?? 'No nation'}
      </span>
    </>
  );
}

/**
 * Teams nobody plays for.
 *
 * A team with no squad is a row that exists and cannot be used: it can never be
 * a Career Path step or a Grid criterion, and it will sit in search results
 * returning nothing. Cheap to fix and invisible until you look for it.
 *
 * Each chip links to the screen where it gets fixed. This is the one list on
 * the page where every entry is a job, so being able to open it matters more
 * here than in the ranking above.
 */
export function TeamGaps({ data, onExpand, expanded }: {
  data: TeamGapsResponse;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams with no footballers</CardTitle>
      </CardHeader>
      <CardContent>
        <CappedList
          total={data.teams_without_footballers.total}
          shown={data.teams_without_footballers.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel="Every team has at least one footballer."
        >
          {/* Chips rather than rows: every entry here is the same fact — an
              empty squad — so a table would spend two columns repeating it. A
              wrapped list of names is a worklist you can scan. */}
          <ul className="flex flex-wrap gap-1.5">
            {data.teams_without_footballers.items.map(row => (
              <li key={row.id ?? `${row.name}-${row.nation ?? ''}`}>
                {/* The id arrives in a later backend deploy than this page. No
                    id means a chip you cannot open yet — never a chip that
                    vanishes, and never a link to `teamId=undefined`. */}
                {row.id === undefined
                  ? <span className={CHIP}><Gap row={row} /></span>
                  : (
                      <Link href={`/team-players?teamId=${row.id}`} className={CHIP}>
                        <Gap row={row} />
                      </Link>
                    )}
              </li>
            ))}
          </ul>
        </CappedList>
      </CardContent>
    </Card>
  );
}
