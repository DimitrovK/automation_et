'use client';

import type { NationGapsResponse } from '@/types/reports';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { ReportTable } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Nations nothing points at, and the ones the catalogue leans on.
 *
 * Two gaps and one skew, in that order, because the first two are worklists and
 * the third is context for them. A nation with no footballers cannot appear in
 * anything nation-scoped; a nation with no teams cannot appear in club-based
 * content. They overlap heavily but are not the same job.
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
            <NameList rows={data.nations_without_footballers.items} />
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
            <NameList rows={data.nations_without_teams.items} />
          </CappedList>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Where the catalogue is deepest</CardTitle>
          <CardDescription>
            Context for the gaps above: this is what the games will actually feel like to play.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CappedList
            total={data.nations_by_footballers.total}
            shown={data.nations_by_footballers.items.length}
            onExpand={onExpand}
            expanded={expanded}
            emptyLabel="No footballers are assigned to a nation yet."
          >
            <ReportTable>
              <tbody>
                {data.nations_by_footballers.items.map(row => (
                  <tr key={row.short} className="border-b last:border-0">
                    <td className="py-1.5 pr-4 text-sm text-foreground">{row.name}</td>
                    <td className="py-1.5 pr-4 text-xs text-muted-foreground">{row.short}</td>
                    <td className="py-1.5 text-right text-sm font-medium tabular-nums text-foreground">
                      {row.footballers.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ReportTable>
          </CappedList>
        </CardContent>
      </Card>
    </div>
  );
}

/** A plain list of names — no counts, because every row here is a zero. */
function NameList({ rows }: { rows: { name: string; short: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
      {rows.map(row => (
        <li key={row.short} className="text-foreground">
          {row.name}
          <span className="ml-1 text-xs text-muted-foreground">{row.short}</span>
        </li>
      ))}
    </ul>
  );
}
