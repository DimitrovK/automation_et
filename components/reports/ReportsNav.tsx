'use client';

import { BarChart3, Clock, Gamepad2, LayoutGrid, Repeat, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/reports', label: 'Daily Pulse', icon: BarChart3 },
  { href: '/reports/games', label: 'Games', icon: LayoutGrid },
  { href: '/reports/multiplayer', label: 'Multiplayer', icon: Gamepad2 },
  { href: '/reports/patterns', label: 'Patterns', icon: Clock },
  { href: '/reports/duration', label: 'Session length', icon: Timer },
  { href: '/reports/players', label: 'Players', icon: Users },
  { href: '/reports/retention', label: 'Retention', icon: Repeat },
];

export function ReportsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700',
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
