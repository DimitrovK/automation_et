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
import { prettySlug } from '@/lib/user-hub-format';

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
/**
 * What to call a game on screen.
 *
 * Prefers `display_name` ("Grid"). Falls back to `label` ("Grid Game Sessions")
 * only while a backend predating display_name is deployed — a clumsy name beats
 * a raw slug. Falls back to the prettified key when the game is unknown.
 */
export function gameName(meta: GameMeta | undefined, gameKey: string): string {
  return meta?.display_name || meta?.label || prettySlug(gameKey);
}

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

/**
 * The registry re-keyed by the frontend's favourites slug.
 *
 * Favourites are stored as FE game ids ("line-up-game", "tenagoal") while
 * reporting keys off registry keys ("missing11", "tenable"), and no transform
 * turns one into the other — the backend declares the pairing on each game's
 * spec, so a favourites view joins through it instead of carrying its own
 * eleven-game table.
 *
 * A game whose backend predates `favourite_slug` is simply absent here, which
 * degrades to the neutral colour and a prettified slug.
 */
export function byFavouriteSlug(meta: GameMetaMap): GameMetaMap {
  return Object.fromEntries(
    Object.values(meta)
      .filter(game => !!game.favourite_slug)
      .map(game => [game.favourite_slug as string, game]),
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
