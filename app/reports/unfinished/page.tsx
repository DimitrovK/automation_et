'use client';

import { useMemo, useState } from 'react';
import { FilterBar, FilterGroup } from '@/components/reports/FilterBar';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { StatTile } from '@/components/reports/StatTile';
import { UnfinishedTable } from '@/components/reports/UnfinishedTable';
import { Switch } from '@/components/ui/switch';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';

/**
 * What is sitting unfinished right now.
 *
 * The only report here with no range control, and that is the point rather than
 * an omission. Every other page answers a question about a period; this one
 * answers a question about state — what is abandoned NOW — and a date range on
 * it would not merely go unused, it would be meaningless.
 *
 * It sits beside the games report's abandoned pool rather than replacing it.
 * That one measures a window (`started - finished`) and answers "how much did
 * this period leak"; this one reads the rows and answers "what is lying around".
 * The same game can look different in each, and both are true.
 */
export default function UnfinishedPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // Not in the URL like the other pages' filters: there is no range to bookmark
  // alongside it, and the snapshot a link would restore is gone by the time it
  // is opened.
  const [includeBots, setIncludeBots] = useState(false);
  const { meta } = useGameMeta(enabled);

  const params = useMemo(() => ({ include_bots: includeBots }), [includeBots]);
  // The fetcher closes over `includeBots` and is a new function each render,
  // which is safe: useReport invokes it through a ref and refetches on the
  // params VALUE. That indirection is what stopped the request loop this hook
  // was built to fix.
  const state = useReport(
    () => ReportsAPI.getUnfinished(includeBots),
    params,
    enabled,
    'The unfinished-sessions endpoint',
  );

  return (
    <ReportsShell
      title="Sitting unfinished"
      description="Sessions started and never finished, as they stand right now — per game, by how long they have sat."
    >
      <FilterBar>
        <FilterGroup
          label="Accounts"
          hint="Bot and simulation accounts (is_dummy). Off by default — Anonymous players are real people and are always counted."
        >
          <label
            htmlFor="unfinished-include-bots"
            className="flex h-8 items-center gap-2 text-sm text-muted-foreground"
          >
            <Switch
              id="unfinished-include-bots"
              checked={includeBots}
              onCheckedChange={setIncludeBots}
            />
            Include bots
          </label>
        </FilterGroup>
      </FilterBar>

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <>
            {/* A snapshot with no timestamp cannot be judged: a tab left open
                for an hour looks exactly like one opened a second ago, and this
                page has no range control to hint otherwise. Rendered in the
                reader's own clock, because the only question it answers is "how
                old is what I am looking at". */}
            <p className="text-xs text-muted-foreground">
              {`Taken ${new Date(data.as_of).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}`}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatTile
                label="Sitting unfinished"
                value={data.total_stale_sessions.toLocaleString()}
                hint="Older than an hour, across every game"
                metric="stale_sessions"
              />
              <StatTile
                label="Including the last hour"
                value={data.total_unfinished.toLocaleString()}
                // The difference between the two tiles IS the "probably still
                // playing" pool, so both are shown rather than making a reader
                // subtract to find it.
                hint="The gap between these two is roughly what is still being played"
              />
            </div>

            <UnfinishedTable rows={data.rows} meta={meta} />

            <p className="text-xs text-muted-foreground">
              {/* Stated on the page, not just in the glossary: a reader comparing
                  two games needs to know the number cannot say when the player
                  actually left, only when they started. */}
              Age is measured from when a session started, so a row that has sat two
              hours is one where the player has been gone anywhere between two hours
              and no time at all. Saying when someone actually stopped needs a
              last-activity timestamp, which the games do not record yet.
            </p>
          </>
        )}
      </ReportPanel>
    </ReportsShell>
  );
}
