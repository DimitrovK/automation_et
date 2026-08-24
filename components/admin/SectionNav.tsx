'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string; icon: LucideIcon };
/**
 * `heading` is empty for a section with a single group. Headings earn their
 * place by telling groups apart; one heading over one group only labels the
 * obvious, and a lone "Sections" caption is noise.
 */
export type NavGroup = { heading: string; items: NavItem[] };

/**
 * Grouped section nav, shared by every admin section.
 *
 * The headings are the point. Reports has ten destinations, and a flat row of
 * ten reads as a wall of equally-weighted choices — you have to know the names
 * already to find anything. Grouping them by the question they answer
 * (overview / per-game / players) puts real structure on screen, so the nav
 * teaches the section rather than just listing it.
 *
 * `exact` matters for the section root: "/reports" is a prefix of every other
 * reports URL, so a prefix match would light it up on every page.
 */
export function SectionNav({ groups, trailing }: {
  groups: NavGroup[];
  /** Reference material — present, but not competing with the sections. */
  trailing?: NavItem;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <nav aria-label="Section" className="rounded-lg border bg-card/60 p-2">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {groups.map(group => (
          <div key={group.heading || 'ungrouped'} className="min-w-40 flex-1">
            {group.heading && (
              <p className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.heading}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {trailing && (
        <div className="mt-2 flex justify-end border-t pt-2">
          <Link
            href={trailing.href}
            aria-current={isActive(trailing.href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              isActive(trailing.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <trailing.icon className="size-3.5" />
            {trailing.label}
          </Link>
        </div>
      )}
    </nav>
  );
}
