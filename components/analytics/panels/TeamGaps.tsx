'use client';

import type { TeamGapsResponse } from '@/types/reports';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { ReportTable } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Teams nobody plays for.
 *
 * A team with no squad is a row that exists and cannot be used: it can never be
 * a Career Path step or a Grid criterion, and it will sit in search results
 * returning nothing. Cheap to fix and invisible until you look for it.
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
        <CardDescription>
          A team with an empty squad cannot be a career step or a grid criterion — it is a
          row that exists and does nothing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CappedList
          total={data.teams_without_footballers.total}
          shown={data.teams_without_footballers.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel="Every team has at least one footballer."
        >
          <ReportTable>
            <tbody>
              {data.teams_without_footballers.items.map(row => (
                <tr key={`${row.name}-${row.nation ?? ''}`} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 text-sm text-foreground">{row.name}</td>
                  <td className="py-1.5 text-right text-xs text-muted-foreground">
                    {/* Not `null` — a team with no nation is its own small gap. */}
                    {row.nation ?? 'No nation'}
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        </CappedList>
      </CardContent>
    </Card>
  );
}
