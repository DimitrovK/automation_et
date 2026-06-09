// Pure analytics derived from the favourites-usage payload (no BE, no deps).
// Everything here works off `users[]` (each user's ordered favourite_games)
// plus the totals already in the response.

import type { FavouritesUsageResponse, FavouritesUsageUser, GameEngagementRow, TrendGranularity } from '@/types/user-hub';
import { prettySlug } from './user-hub-format';

export type SlugCount = { slug: string; label: string; count: number };

/** Format a trend period (ISO date) for an axis tick. */
export function formatTrendDate(iso: string, granularity: TrendGranularity): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  // The BE sends a calendar date (no time); format in UTC so it renders as the
  // intended day regardless of the viewer's timezone.
  const label = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
  return granularity === 'week' ? `wk ${label}` : label;
}

/** Engagement rows sorted by favourited count, desc. */
export function sortEngagementRows(rows: GameEngagementRow[]): GameEngagementRow[] {
  return [...rows].sort((a, b) => b.favourited_count - a.favourited_count);
}
export type DepthBucket = { bucket: string; count: number };

/** Average number of favourites among users who have any. */
export function avgFavouritesPerUser(data: FavouritesUsageResponse): number {
  if (data.users_with_favourites === 0) {
    return 0;
  }
  const total = data.users.reduce((sum, u) => sum + u.favourite_games.length, 0);
  return total / data.users_with_favourites;
}

/** How many users picked each game as their #1 (index-0) favourite, desc. */
export function firstChoiceCounts(users: FavouritesUsageUser[]): SlugCount[] {
  const counts = new Map<string, number>();
  for (const u of users) {
    const first = u.favourite_games[0];
    if (first) {
      counts.set(first, (counts.get(first) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: prettySlug(slug), count }))
    .sort((a, b) => b.count - a.count);
}

/** Distribution of how many games users favourite: 1, 2, 3, 4, 5+. */
export function favouriteDepthDistribution(users: FavouritesUsageUser[]): DepthBucket[] {
  const buckets: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
  for (const u of users) {
    const n = u.favourite_games.length;
    if (n <= 0) {
      continue;
    }
    const key = n >= 5 ? '5+' : String(n);
    buckets[key] += 1;
  }
  return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** CSV of the users×favourites matrix (one row per user). */
export function favouritesToCsv(users: FavouritesUsageUser[]): string {
  const header = 'id,username,favourite_count,favourite_games';
  const rows = users.map(u =>
    [u.id, csvCell(u.username), u.favourite_games.length, csvCell(u.favourite_games.join('|'))].join(','),
  );
  return [header, ...rows].join('\n');
}
