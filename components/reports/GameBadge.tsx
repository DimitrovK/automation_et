'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import { X } from 'lucide-react';
import { gameName, useGameColor } from '@/hooks/use-game-meta';
import { cn } from '@/lib/utils';

/**
 * A game chip, coloured from the BE registry.
 *
 * Colour is applied inline rather than via Tailwind classes on purpose: the
 * palette is server-driven, so a class-per-game map would have to be updated by
 * hand every time a game is added — exactly the drift this endpoint exists to
 * avoid.
 */
export function GameBadge({ gameKey, meta, active, onClick, count }: {
  gameKey: string;
  meta: GameMetaMap;
  /** Renders as selected, with a clear affordance to unselect. */
  active?: boolean;
  onClick?: (gameKey: string) => void;
  count?: number;
}) {
  const resolveColor = useGameColor();
  const color = resolveColor(meta, gameKey);
  const label = gameName(meta[gameKey], gameKey);
  const interactive = !!onClick;

  const style = active
    ? { backgroundColor: color, borderColor: color, color: '#fff' }
    : { borderColor: color, color };

  return (
    <button
      type="button"
      disabled={!interactive}
      aria-pressed={interactive ? !!active : undefined}
      title={interactive ? (active ? `Clear ${label} filter` : `Show only ${label}`) : label}
      onClick={() => onClick?.(gameKey)}
      style={style}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all',
        interactive ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
        !active && 'bg-transparent',
      )}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: active ? '#fff' : color }}
        aria-hidden
      />
      {label}
      {count !== undefined && <span className="opacity-70">{count.toLocaleString()}</span>}
      {active && <X className="size-3" aria-hidden />}
    </button>
  );
}
