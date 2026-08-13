'use client';

import type { NavGroup, NavItem } from '@/components/admin/SectionNav';
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SectionNav } from '@/components/admin/SectionNav';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

/**
 * Chrome shared by the admin sections: auth, access gate, header, sub-nav.
 *
 * Reports and User Hub were two implementations of the same page: same
 * gradient, same centred heading, same nav-then-content, each drifting
 * separately. One shell means a change to how a section reads happens once.
 *
 * `requireSuperuser` is the one real difference between them. Reports gates on
 * is_staff, matching the BE where every /core/reporting/* endpoint is
 * IsAdminUser; User Hub gates on superuser because it exposes per-user data
 * rather than platform aggregates. That distinction is a parameter, not a
 * reason to keep two shells.
 */
export function SectionShell({
  title,
  description,
  groups,
  trailing,
  requireSuperuser = false,
  actions,
  children,
}: {
  title: string;
  description: string;
  groups: NavGroup[];
  trailing?: NavItem;
  requireSuperuser?: boolean;
  /** Section-level controls that belong beside the title, not inside a card. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const allowed = requireSuperuser ? !!user?.is_superuser : !!(user?.is_staff || user?.is_superuser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      {/* Numbers are read down columns here, so they get tabular figures — a
          "1" and a "7" occupy the same width and the eye can compare rows
          without re-reading each one. */}
      <div className="mx-auto max-w-7xl space-y-6 [font-variant-numeric:tabular-nums]">
        <Navigation />

        {/* Left-aligned, not centred: the eye starts at the same x-position as
            every heading and table below it, so the page has one reading edge
            instead of two. */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-300">{description}</p>
          </div>
          {actions}
        </div>

        {allowed
          ? (
              <>
                <SectionNav groups={groups} trailing={trailing} />
                {children}
              </>
            )
          : (
              <div className="mx-auto max-w-md py-16">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="size-5 text-amber-600" />
                      {requireSuperuser ? 'Admin access required' : 'Staff access required'}
                    </CardTitle>
                    <CardDescription>
                      {requireSuperuser
                        ? 'This section is limited to administrator accounts.'
                        : 'Reports are limited to staff accounts.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You're signed in, but your account doesn't have access. Ask an
                      administrator to grant it if you need it.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
      </div>
    </div>
  );
}
