'use client';

import Link from 'next/link';
import { CONTENT_ANALYTICS_BY_GAME } from '@/lib/global-nav';
import { cn } from '@/lib/utils';

/**
 * The two halves of one game's story, as tabs.
 *
 * A game with a content-analytics page has two surfaces answering two
 * questions — Behaviour (how players behave: /reports/games/<key>) and
 * Content (whether the material is any good: /analytics/<page>). They
 * were tied by prose links, which made them read as two places that
 * happen to mention each other; tabs make them one place with two views.
 * Games without a content page render nothing — no empty chrome.
 *
 * The URLs (and each side's own default range) stay as they are: a tab
 * is a link, not shared state.
 */
export function SurfaceTabs({ gameKey, active }: {
  gameKey: string;
  active: 'behaviour' | 'content';
}) {
  const contentHref = CONTENT_ANALYTICS_BY_GAME[gameKey];
  if (!contentHref) {
    return null;
  }

  const tabs = [
    { key: 'behaviour' as const, label: 'Behaviour', href: `/reports/games/${gameKey}` },
    { key: 'content' as const, label: 'Content', href: contentHref },
  ];

  return (
    <div role="tablist" aria-label="Game surface" className="inline-flex gap-1 rounded-lg border bg-background/60 p-1">
      {tabs.map(tab => (
        <Link
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          href={tab.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
