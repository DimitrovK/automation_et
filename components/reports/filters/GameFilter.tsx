'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import { FilterGroup } from '@/components/reports/filters/FilterBar';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { gameName } from '@/hooks/use-game-meta';

/**
 * Pick one game, or all of them.
 *
 * The retention and patterns endpoints have accepted `game_type` since they were
 * written; nothing in the UI ever sent it, so "which game keeps people coming
 * back" and "when is Grid played" were a query parameter away and unreachable.
 *
 * Games come from the BE registry rather than from the response, so every game
 * is selectable even when it has no rows in the current window — a game with
 * zero retention is exactly the one worth looking at, and building the list
 * from the data would hide it.
 */
export function GameFilter({ meta, value, onChange }: {
  meta: GameMetaMap;
  value: string | null;
  onChange: (game: string | null) => void;
}) {
  // Sorted by what is displayed. Sorting by `label` put games in an order the
  // reader can't see, because the visible names differ from it.
  const games = Object.values(meta).sort(
    (a, b) => gameName(a, a.key).localeCompare(gameName(b, b.key)),
  );

  if (games.length === 0) {
    return null;
  }

  return (
    <FilterGroup label="Game" hint="Narrows every panel on the page to one game.">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={value === null
            ? 'rounded-full border border-emerald-600 bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white'
            : 'rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground/80 hover:bg-muted/50'}
        >
          All games
        </button>
        {games.map(game => (
          <GameBadge
            key={game.key}
            gameKey={game.key}
            meta={meta}
            active={value === game.key}
            onClick={key => onChange(value === key ? null : key)}
          />
        ))}
      </div>
    </FilterGroup>
  );
}
