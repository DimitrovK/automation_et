'use client';

import type { SeasonReport } from '@/types/reports';
import Link from 'next/link';
import { StatFigure } from '@/components/reports/primitives/StatTile';
import { Card, CardContent } from '@/components/ui/card';

/**
 * One game's place in the season, on its `/games/<key>` page. Season-wide on
 * purpose: the range picker below it does not apply to a season.
 */
export function SeasonGameStrip({ report, gameKey }: { report: SeasonReport; gameKey: string }) {
  const row = report.games.find(game => game.stats_key === gameKey);
  if (!row) {
    return null;
  }
  const started = row.size !== null;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <p>
            <span className="font-semibold text-foreground">{`This season · ${report.season.name}`}</span>
            <span className="text-muted-foreground">{` · ${report.timing}`}</span>
          </p>
          <Link href={`/reports/season?season=${report.season.number}`} className="text-primary hover:underline">
            Season page
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatFigure label="Counted games" value={row.counted.toLocaleString()} />
          <StatFigure label="On the main board" value={started ? row.size!.toLocaleString() : '—'} hint={`From ${row.min_games} game${row.min_games === 1 ? '' : 's'}`} />
          <StatFigure label="Leader" value={<span className="text-base">{row.leader}</span>} />
          <StatFigure
            label="Board"
            value={(
              <a href={row.page} target="_blank" rel="noreferrer" className="text-base text-primary hover:underline">
                Open on the site
              </a>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
