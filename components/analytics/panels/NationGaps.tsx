'use client';

import type { NationGapsResponse, NationRow } from '@/types/reports';
import Link from 'next/link';
import { NationCrest } from '@/components/analytics/NationCrest';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import config from '@/lib/config';
import { nationFootballersHref } from '@/lib/nation-param';

const CHIP = 'inline-flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-sm ring-1 ring-inset ring-border transition-colors hover:bg-muted';

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
      <NationCrest short={row.short} flag={row.flag} className="size-6 rounded" />
      <span className="font-medium text-foreground">{row.name}</span>
      <span className="text-xs text-muted-foreground">{row.short}</span>
    </>
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
      <Card>
        <CardHeader>
          <CardTitle>Nations with no footballers</CardTitle>
          <CardDescription>
            Nothing nation-scoped can use these — no national-team clue, no nation criterion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CappedList
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
                  <Link href={nationFootballersHref(row.short)} className={CHIP}>
                    <NationChip row={row} />
                  </Link>
                </li>
              ))}
            </ul>
          </CappedList>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nations with no teams</CardTitle>
          <CardDescription>
            A separate gap: club-based content needs a team in the country, not just a player from it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CappedList
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
                    className={CHIP}
                  >
                    <NationChip row={row} />
                  </a>
                </li>
              ))}
            </ul>
          </CappedList>
        </CardContent>
      </Card>
    </div>
  );
}
