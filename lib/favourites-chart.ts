/**
 * Row-building for the favourites charts, kept out of the components.
 *
 * A recharts tree renders nothing measurable in jsdom — a `ResponsiveContainer`
 * has no size there, so asserting on bar colours means asserting on an empty
 * SVG. The part worth guarding is the join, not the drawing: which name and
 * which colour each favourites slug resolves to. That is a pure function, so
 * it lives here and is tested directly (the same reason `heatmapRamp` is
 * exported rather than reached through its component).
 */

import type { GameMetaMap } from '@/hooks/use-game-meta';
import { gameColor, gameName } from '@/hooks/use-game-meta';
import { toChartData } from '@/lib/user-hub-format';

export type PopularityRow = { slug: string; label: string; count: number; fill: string };

/**
 * Favourites counts as chart rows, most-favourited first, each carrying the
 * game's registry name and its colour for the current surface.
 *
 * `meta` is keyed by favourites slug (see `byFavouriteSlug`) — indexing it by
 * registry key would silently work for the eight games whose two names happen
 * to match and mis-colour the three that differ.
 */
export function popularityRows(
  gamePopularity: Record<string, number>,
  meta: GameMetaMap,
  isDark: boolean,
): PopularityRow[] {
  return toChartData(gamePopularity).map(row => ({
    ...row,
    label: gameName(meta[row.slug], row.slug),
    fill: gameColor(meta[row.slug], isDark),
  }));
}
