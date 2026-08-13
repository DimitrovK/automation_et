import type { ActivityDay, MetricKey } from '@/types/reports';

/**
 * Rolling the daily activity series up to weeks or months.
 *
 * A 90-day daily line is mostly noise — the weekly shape is what you actually
 * read. But rolling up is only valid for metrics that sum.
 *
 * `distinct_players` does not. Someone who plays on Monday and Thursday is one
 * player that week, not two, so adding the daily figures inflates it — the same
 * mistake that once made the platform total read 5.6× too high. There is no way
 * to recover a weekly distinct count from daily distinct counts; it needs a
 * query the client doesn't have. So this refuses to aggregate it rather than
 * producing a number that looks plausible and is wrong.
 */

export type Granularity = 'day' | 'week' | 'month';

export const GRANULARITIES: Granularity[] = ['day', 'week', 'month'];

/** Mirrors ADDITIVE_METRICS in core/reporting_queries.py. */
const ADDITIVE: MetricKey[] = ['games_started', 'games_finished', 'mp_player_sessions'];

export function canAggregate(metric: MetricKey): boolean {
  return ADDITIVE.includes(metric);
}

/** ISO week start (Monday), so buckets line up with how weeks are read. */
function startOfWeek(date: Date): Date {
  const out = new Date(date);
  const weekday = (out.getUTCDay() + 6) % 7;
  out.setUTCDate(out.getUTCDate() - weekday);
  return out;
}

function bucketKey(iso: string, granularity: Granularity): string {
  if (granularity === 'day') {
    return iso;
  }
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  if (granularity === 'month') {
    return `${iso.slice(0, 7)}-01`;
  }
  return startOfWeek(date).toISOString().slice(0, 10);
}

/**
 * Group the series into buckets, summing the additive metrics.
 *
 * `covered` survives as AND: a bucket containing an uncomputed day is not fully
 * covered, and saying otherwise would hide a gap inside a wider bar.
 */
export function aggregateSeries(series: ActivityDay[], granularity: Granularity): ActivityDay[] {
  if (granularity === 'day') {
    return series;
  }

  const buckets = new Map<string, ActivityDay>();
  for (const row of series) {
    const key = bucketKey(row.date, granularity);
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, { ...row, date: key });
      continue;
    }
    for (const metric of ADDITIVE) {
      existing[metric] += row[metric];
    }
    // Deliberately not summed — see the note above. Carried as the largest
    // single day in the bucket, which is a true lower bound for the period
    // rather than an invented total.
    existing.distinct_players = Math.max(existing.distinct_players, row.distinct_players);
    existing.covered = existing.covered && row.covered;
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** How many days each bucket represents, for labelling. */
export function bucketLabel(granularity: Granularity): string {
  return granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';
}
