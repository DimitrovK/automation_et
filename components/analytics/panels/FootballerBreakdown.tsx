'use client';

import type { CoverageResponse } from '@/types/reports';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { ReportTable } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Who is adding footballers, and how many of them have stopped playing.
 *
 * Contributors is footballers ONLY. `Footballer` is the single model of the
 * three that records who added it — `Team` and `Nation` carry no author — so
 * presenting this as catalogue-wide authorship would credit one person with
 * work the schema cannot attribute.
 */
export function FootballerBreakdown({ data, onExpand, expanded }: {
  data: CoverageResponse;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  const { contributors, career_state: careerState } = data;

  // The BE may not carry these yet — the repositories deploy independently.
  if (!contributors && !careerState) {
    return null;
  }

  const total = careerState ? careerState.retired + careerState.active : 0;
  const retiredPct = total ? Math.round((careerState!.retired / total) * 1000) / 10 : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {contributors && (
        <Card>
          <CardHeader>
            <CardTitle>Who added them</CardTitle>
            <CardDescription>
              Footballers only — teams and nations do not record who added them, so this is
              not the whole catalogue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CappedList
              total={contributors.total}
              shown={contributors.items.length}
              onExpand={onExpand}
              expanded={expanded}
              emptyLabel="No footballer records who added it."
            >
              <ReportTable>
                <tbody>
                  {contributors.items.map(row => (
                    <tr key={row.username} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 text-sm text-foreground">{row.username}</td>
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
      )}

      {careerState && (
        <Card>
          <CardHeader>
            <CardTitle>Still playing, or retired</CardTitle>
            <CardDescription>
              Which games can use whom: a retired footballer cannot appear in anything
              scoped to a current squad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="space-y-3">
              <Row label="Retired" value={careerState.retired} total={total} />
              <Row label="Still playing" value={careerState.active} total={total} />
            </dl>
            {retiredPct !== null && (
              <p className="text-xs text-muted-foreground">
                {`${retiredPct}% of the approved catalogue has retired.`}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium tabular-nums text-foreground">{value.toLocaleString()}</dd>
      </div>
      <Progress value={total ? (value / total) * 100 : 0} aria-label={`${label}: ${value} of ${total}`} />
    </div>
  );
}
