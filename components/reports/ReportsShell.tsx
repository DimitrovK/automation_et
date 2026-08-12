'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { ReportsNav } from '@/components/reports/ReportsNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

/**
 * Chrome shared by every Reports page: auth, staff gate, header, sub-nav.
 *
 * Gated on `is_staff`, not `is_superuser` — that mirrors the BE, where every
 * `/core/reporting/*` endpoint is `IsAdminUser` (DRF's name for is_staff). The
 * User Hub gates on superuser instead because it exposes private per-user data;
 * these are platform aggregates. This is a friendlier "no access" than silently
 * hitting 403s, not the security boundary.
 */
export function ReportsShell({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const isStaff = !!(user?.is_staff || user?.is_superuser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>

        {isStaff
          ? (
              <>
                <ReportsNav />
                {children}
              </>
            )
          : (
              <div className="mx-auto max-w-md py-16">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="size-5 text-orange-600" />
                      Staff access required
                    </CardTitle>
                    <CardDescription>
                      Reports are limited to staff accounts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You're signed in, but your account isn't staff. Ask an administrator
                      to grant access if you need it.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
      </div>
    </div>
  );
}
