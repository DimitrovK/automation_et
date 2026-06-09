'use client';

import { BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { AdminGate } from '@/components/user-hub/AdminGate';
import { AdoptionTrendsChart } from '@/components/user-hub/AdoptionTrendsChart';
import { AnalyticsSkeleton } from '@/components/user-hub/AnalyticsSkeleton';
import { FavouredVsPlayedChart } from '@/components/user-hub/FavouredVsPlayedChart';
import { FavouriteInsights } from '@/components/user-hub/FavouriteInsights';
import { FavouritesUsageSummary } from '@/components/user-hub/FavouritesUsageSummary';
import { GamePopularityChart } from '@/components/user-hub/GamePopularityChart';
import { UserHubNav } from '@/components/user-hub/UserHubNav';
import { useAdoptionTrends } from '@/hooks/use-adoption-trends';
import { useFavouredVsPlayed } from '@/hooks/use-favoured-vs-played';
import { useFavouritesUsage } from '@/hooks/use-favourites-usage';
import { useAuth } from '@/lib/auth';

export default function UserHubAnalyticsPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const isAdmin = isAuthenticated && !!user?.is_superuser;
  const { data, isLoading: dataLoading, error, notDeployed, refetch } = useFavouritesUsage(isAdmin);
  const trends = useAdoptionTrends(isAdmin);
  const played = useFavouredVsPlayed(isAdmin);

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
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <BarChart3 className="size-7 text-emerald-600" />
            {' '}
            Favourites Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Favourites adoption metrics. Click a game bar to see who favourited it.
          </p>
        </div>

        {!user?.is_superuser
          ? (
              <AdminGate />
            )
          : (
              <>
                <UserHubNav />
                {dataLoading && <AnalyticsSkeleton />}

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
                    <GamePopularityChart
                      gamePopularity={data.game_popularity}
                      onGameSelect={slug => router.push(`/user-hub/users?favourite_game=${encodeURIComponent(slug)}`)}
                    />
                    <FavouriteInsights data={data} />
                  </>
                )}

                {/* Independently guarded — each degrades on its own if its BE
                    endpoint isn't deployed yet. */}
                <AdoptionTrendsChart
                  data={trends.data}
                  isLoading={trends.isLoading}
                  error={trends.error}
                  notDeployed={trends.notDeployed}
                  granularity={trends.granularity}
                  onGranularityChange={trends.setGranularity}
                  onRetry={trends.refetch}
                />
                <FavouredVsPlayedChart
                  data={played.data}
                  isLoading={played.isLoading}
                  error={played.error}
                  notDeployed={played.notDeployed}
                  onRetry={played.refetch}
                />
              </>
            )}
      </div>
    </div>
  );
}
