'use client';

import type { TeamGapsResponse } from '@/types/reports';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
              <li
                key={`${row.name}-${row.nation ?? ''}`}
                className="inline-flex items-baseline gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-sm ring-1 ring-inset ring-border transition-colors hover:bg-muted"
              >
                <span className="font-medium text-foreground">{row.name}</span>
                {/* Not `null` — a team with no nation is its own small gap. */}
                <span className="text-xs text-muted-foreground">{row.nation ?? 'No nation'}</span>
              </li>
            ))}
          </ul>
        </CappedList>
      </CardContent>
    </Card>
  );
}
