'use client';

import { BarChart3, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** The User Hub's sub-sections — single source of truth for the in-page nav. */
export const USER_HUB_SECTIONS = [
  { href: '/user-hub', label: 'Overview', icon: LayoutDashboard },
  { href: '/user-hub/users', label: 'Users', icon: Users },
  { href: '/user-hub/analytics', label: 'Favourites Analytics', icon: BarChart3 },
] as const;

/**
 * Segmented tab bar shown at the top of every User Hub page so the sections
 *  are reachable from one another (not only via the navbar dropdown).
 */
export function UserHubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1 rounded-lg border bg-white/60 p-1 dark:bg-gray-800/60">
      {USER_HUB_SECTIONS.map((s) => {
        const Icon = s.icon;
        const isActive = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50',
            )}
          >
            <Icon className="size-4" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
