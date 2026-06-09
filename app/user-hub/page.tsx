'use client';

import { ArrowRight, BarChart3, ShieldCheck, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminGate } from '@/components/user-hub/AdminGate';
import { UserHubNav } from '@/components/user-hub/UserHubNav';
import { useAuth } from '@/lib/auth';

type HubOption = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  cta: string;
  disabled?: boolean;
};

const OPTIONS: HubOption[] = [
  {
    title: 'Favourites Analytics',
    description: 'Adoption of favourite games and which games are most favourited.',
    icon: <BarChart3 className="size-5 text-emerald-600" />,
    href: '/user-hub/analytics',
    cta: 'Open analytics',
  },
  {
    title: 'Users',
    description: 'Search and filter users; open a profile to view favourites and status. Read-only.',
    icon: <Users className="size-5 text-emerald-600" />,
    href: '/user-hub/users',
    cta: 'Browse users',
  },
  {
    title: 'Audit & moderation',
    description: 'Suspension history and a “who changed what” audit trail.',
    icon: <ShieldCheck className="size-5 text-gray-400" />,
    cta: 'Coming soon (Phase 2)',
    disabled: true,
  },
];

export default function UserHubLandingPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Hub</h1>
          <p className="text-gray-600 dark:text-gray-300">
            User analytics and management — admin-only.
          </p>
        </div>

        {!user?.is_superuser
          ? (
              <AdminGate />
            )
          : (
              <>
                <UserHubNav />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {OPTIONS.map(o => (
                    <Card
                      key={o.title}
                      className={o.disabled ? 'opacity-60' : 'transition-shadow duration-200 hover:shadow-lg'}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          {o.icon}
                          {o.title}
                        </CardTitle>
                        <CardDescription>{o.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant={o.disabled ? 'outline' : 'default'}
                          disabled={o.disabled}
                          onClick={() => o.href && router.push(o.href)}
                          className={o.disabled
                            ? 'w-full'
                            : 'w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'}
                        >
                          {o.cta}
                          {!o.disabled && <ArrowRight className="ml-2 size-4" />}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
      </div>
    </div>
  );
}
