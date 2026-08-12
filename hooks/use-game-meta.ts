/**
 * Game display metadata (label + colour), keyed for O(1) lookup.
 *
 * The colours come from the BE registry — the same ones the Django admin
 * dashboard draws each game with — so a new game is coloured automatically and
 * the two surfaces can't drift apart.
 */

import type { GameMeta } from '@/types/reports';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/reports-api';

export type GameMetaMap = Record<string, GameMeta>;

/** Neutral grey for a game the BE hasn't told us about yet. */
export const FALLBACK_COLOR = '#94a3b8';

/**
 * The colour to draw a game with on the current surface.
 *
 * A dark theme needs its own steps, not a flipped light colour: five games sat
 * between 2.2 and 2.8:1 on the dark card when one palette served both, which
 * reads as a smudge rather than a colour. `color_dark` is optional, so a BE
 * that predates it degrades to the light colour rather than to grey.
 */
export function gameColor(meta: GameMeta | undefined, isDark: boolean): string {
  if (!meta) {
    return FALLBACK_COLOR;
  }
  return isDark ? (meta.color_dark ?? meta.color) : meta.color;
}

/**
 * Resolver for components that receive `meta` as a prop rather than calling
 * `useGameMeta` themselves. Reads the theme here so no component has to accept
 * an `isDark` prop it would only pass straight through — and so a new consumer
 * can't quietly draw the light colour on a dark card.
 */
export function useGameColor() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useCallback(
    (meta: GameMetaMap, gameKey: string) => gameColor(meta[gameKey], isDark),
    [isDark],
  );
}

export function useGameMeta(enabled: boolean) {
  const [meta, setMeta] = useState<GameMetaMap>({});
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    ReportsAPI.getGames()
      .then((res) => {
        if (!cancelled) {
          setMeta(Object.fromEntries(res.games.map(game => [game.key, game])));
        }
      })
      // Colours are cosmetic — a failure here must not take the page down, so
      // callers fall back to FALLBACK_COLOR and a prettified slug. There is
      // deliberately no isLoading: nothing blocks on this, and badges simply
      // start neutral and gain colour when it lands.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Bound to the resolved theme so callers can't forget which surface they're
  // drawing on — the common way a dark-mode palette silently goes unused.
  const colorFor = useCallback(
    (gameKey: string) => gameColor(meta[gameKey], isDark),
    [meta, isDark],
  );

  return { meta, isDark, colorFor };
}
