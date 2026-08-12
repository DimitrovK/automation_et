/**
 * Game display metadata (label + colour), keyed for O(1) lookup.
 *
 * The colours come from the BE registry — the same ones the Django admin
 * dashboard draws each game with — so a new game is coloured automatically and
 * the two surfaces can't drift apart.
 */

import type { GameMeta } from '@/types/reports';
import { useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/reports-api';

export type GameMetaMap = Record<string, GameMeta>;

/** Neutral grey for a game the BE hasn't told us about yet. */
export const FALLBACK_COLOR = '#94a3b8';

export function useGameMeta(enabled: boolean) {
  const [meta, setMeta] = useState<GameMetaMap>({});

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

  return { meta };
}
