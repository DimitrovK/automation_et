'use client';

import { BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { AdminGate } from '@/components/user-hub/AdminGate';
import { FavouritesUsageSummary } from '@/components/user-hub/FavouritesUsageSummary';
import { GamePopularityChart } from '@/components/user-hub/GamePopularityChart';
import { UserHubNav } from '@/components/user-hub/UserHubNav';
import { useFavouritesUsage } from '@/hooks/use-favourites-usage';
import { useAuth } from '@/lib/auth';

export default function UserHubAnalyticsPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { data, isLoading: dataLoading, error, notDeployed, refetch } = useFavouritesUsage(
    isAuthenticated && !!user?.is_superuser,
  );

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-5xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <BarChart3 className="size-7 text-emerald-600" />
            {' '}
            Favourites Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            How many users have set favourite games, and which games are most favourited.
          </p>
        </div>

        {!user?.is_superuser
          ? (
              <AdminGate />
            )
          : (
              <>
                <UserHubNav />
                {dataLoading && <p className="text-center text-sm text-gray-500">Loading analytics…</p>}

                {error && (
                  <div
                    role="alert"
                    className="whitespace-pre-line rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    {error}
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
                    </div>
                  </div>
                )}

                {data && !notDeployed && (
                  <>
                    <FavouritesUsageSummary data={data} />
                    <GamePopularityChart gamePopularity={data.game_popularity} />
                  </>
                )}
              </>
            )}
      </div>
    </div>
  );
}
