'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InsightsShell } from '@/components/insights/InsightsShell';
import { ReportError } from '@/components/reports/primitives/ReportError';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { SeasonChecklist } from '@/components/seasons/SeasonChecklist';
import { SeasonPerDay } from '@/components/seasons/SeasonPerDay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeasonReport } from '@/hooks/use-season-report';
import { useAuth } from '@/lib/auth';

/** `?season=<number>`, read once from the URL (the page is prerendered, so not useSearchParams). */
function seasonFromUrl(): number | null {
  const value = new URLSearchParams(globalThis.location?.search ?? '').get('season');
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

/**
 * One season (App#2604): the Django admin's Season dashboard, read here
 * through the same backend function, so the numbers never disagree. Read only:
 * rewards, reviews and awards stay in the Django admin, and every open
 * checklist step links there.
 */
export default function SeasonPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const [season, setSeason] = useState<number | null>(null);
  const [urlRead, setUrlRead] = useState(false);
  // A one-shot mount read, as `useReportFilters` does: a render-time read would disagree with the prerendered markup.
  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setSeason(seasonFromUrl());
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setUrlRead(true);
  }, []);
  const report = useSeasonReport(season, enabled && urlRead);
  const data = report.data;

  const pick = (next: number) => {
    setSeason(next);
    globalThis.history.replaceState(null, '', `${globalThis.location.pathname}?season=${next}`);
  };

  return (
    <InsightsShell title="Season" description="How the season is going, and what is left to do before its awards.">
      {report.error
        ? <ReportError error={report.error} notDeployed={report.notDeployed} onRetry={report.refetch} />
        : !data
            ? <Skeleton className="h-96 w-full" />
            : (
                <>
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-foreground">{data.season.name}</p>
                          <p className="text-sm text-muted-foreground">{`${data.season.audience_label} · ${data.dates}`}</p>
                        </div>
                        <select
                          aria-label="Season"
                          value={data.season.number}
                          onChange={event => pick(Number(event.target.value))}
                          className="h-8 rounded-md border bg-background px-2 text-sm font-medium"
                        >
                          {data.seasons.map(option => <option key={option.number} value={option.number}>{option.name}</option>)}
                        </select>
                      </div>
                      <p className="text-sm text-foreground">{data.timing}</p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full bg-emerald-600" style={{ width: `${data.progress}%` }} />
                      </div>
                      <a href={data.admin_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                        Open in the Django admin
                      </a>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {data.numbers.map(number => (
                      <StatTile key={number.label} label={number.label} value={number.value} hint={number.note || undefined} />
                    ))}
                  </div>

                  <SeasonPerDay rows={data.per_day} />

                  <div className="grid gap-4 lg:grid-cols-5">
                    <Card className="min-w-0 lg:col-span-3">
                      <CardHeader><CardTitle>Games</CardTitle></CardHeader>
                      <CardContent className="overflow-x-auto">
                        <ReportTable>
                          <ReportHead>
                            <Th>Game</Th>
                            <Th align="right">Counted</Th>
                            <Th align="right">Main board</Th>
                            <Th align="right">Min games</Th>
                            <Th>Leader</Th>
                          </ReportHead>
                          <tbody>
                            {data.games.map(game => (
                              <ReportRow key={game.game_key}>
                                <Td strong>
                                  <Link href={`/games/${game.stats_key}`} className="text-primary hover:underline">{game.label}</Link>
                                </Td>
                                <Td align="right">{game.counted.toLocaleString()}</Td>
                                <Td align="right">{game.size === null ? '—' : game.size.toLocaleString()}</Td>
                                <Td align="right">{game.min_games}</Td>
                                <Td>{game.leader}</Td>
                              </ReportRow>
                            ))}
                          </tbody>
                        </ReportTable>
                      </CardContent>
                    </Card>
                    <div className="min-w-0 lg:col-span-2">
                      <SeasonChecklist checks={data.checklist} />
                    </div>
                  </div>

                  {data.champions.length > 0 && (
                    <>
                      <SectionHeader title="Champions" description="Every game's 1st place and the Season Champion, with the season's champion picture." />
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        {data.champions.map(champion => (
                          <div key={`${champion.board}-${champion.username}`} className="space-y-1 text-sm">
                            {champion.picture
                              // eslint-disable-next-line next/no-img-element -- an avatar from the API host, like NationFlag
                              ? <img src={champion.picture} alt={champion.picture_name} className="size-14 rounded-full border object-cover" />
                              : <div className="grid size-14 place-items-center rounded-full border text-[10px] text-muted-foreground">no picture</div>}
                            <p className="text-muted-foreground">{champion.board}</p>
                            <p className="font-semibold text-foreground">{champion.username}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {data.removals.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>Removals and take-backs</CardTitle></CardHeader>
                      <CardContent className="overflow-x-auto">
                        <ReportTable>
                          <tbody>
                            {data.removals.map(removal => (
                              <ReportRow key={`${removal.username}-${removal.game}`}>
                                <Td strong>{removal.username}</Td>
                                <Td>{removal.game}</Td>
                                <Td>{removal.reason}</Td>
                                <Td className="text-muted-foreground">{`${removal.by} · ${removal.at}`}</Td>
                              </ReportRow>
                            ))}
                          </tbody>
                        </ReportTable>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
    </InsightsShell>
  );
}
