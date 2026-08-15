'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import { X } from 'lucide-react';
import Link from 'next/link';
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
export function GameBadge({ gameKey, meta, active, onClick, href, count }: {
  gameKey: string;
  meta: GameMetaMap;
  /** Renders as selected, with a clear affordance to unselect. */
  active?: boolean;
  onClick?: (gameKey: string) => void;
  /**
   * Where this game's full report lives. A badge with one navigates.
   *
   * It has to be a prop rather than something a caller wraps the badge in: this
   * used to render a DISABLED button whenever it had no onClick, and the games
   * table wrapped that in a <Link>. A disabled button swallows the click instead
   * of letting it reach the anchor, so the only route to a per-game report was
   * unreachable — by mouse and, since a disabled button takes no focus, by
   * keyboard too. It was also an <a> wrapping a <button>, which is invalid.
   */
  href?: string;
  count?: number;
}) {
  const resolveColor = useGameColor();
  const color = resolveColor(meta, gameKey);
  const label = gameName(meta[gameKey], gameKey);
  const interactive = !!onClick;

  const style = active
    ? { backgroundColor: color, borderColor: color, color: '#fff' }
    : { borderColor: color, color };

  const chip = cn(
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all',
    (interactive || href) ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
    !active && 'bg-transparent',
  );

  const inner = (
    <>
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: active ? '#fff' : color }}
        aria-hidden
      />
      {label}
      {count !== undefined && <span className="opacity-70">{count.toLocaleString()}</span>}
      {active && <X className="size-3" aria-hidden />}
    </>
  );

  // A filter toggle first: where a badge both selects and could navigate, the
  // selection is what the surrounding control is for.
  if (interactive) {
    return (
      <button
        type="button"
        aria-pressed={!!active}
        title={active ? `Clear ${label} filter` : `Show only ${label}`}
        onClick={() => onClick?.(gameKey)}
        style={style}
        className={chip}
      >
        {inner}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} title={`Open the full report for ${label}`} style={style} className={chip}>
        {inner}
      </Link>
    );
  }

  // Neither: a label, so a <span>. It was a disabled <button>, which announced
  // itself to assistive tech as a control that cannot be used — and blocked any
  // link wrapped around it.
  return (
    <span title={label} style={style} className={chip}>
      {inner}
    </span>
  );
}
