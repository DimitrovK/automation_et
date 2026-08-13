'use client';

import { useRouter } from 'next/navigation';
import { AdoptionTrendsChart } from '@/components/reports/favourites/AdoptionTrendsChart';
import { AnalyticsSkeleton } from '@/components/reports/favourites/AnalyticsSkeleton';
import { FavouredVsPlayedChart } from '@/components/reports/favourites/FavouredVsPlayedChart';
import { FavouriteInsights } from '@/components/reports/favourites/FavouriteInsights';
import { FavouritesUsageSummary } from '@/components/reports/favourites/FavouritesUsageSummary';
import { GamePopularityChart } from '@/components/reports/favourites/GamePopularityChart';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { useAdoptionTrends } from '@/hooks/use-adoption-trends';
import { useFavouredVsPlayed } from '@/hooks/use-favoured-vs-played';
import { useFavouritesUsage } from '@/hooks/use-favourites-usage';
import { byFavouriteSlug, useGameMeta } from '@/hooks/use-game-meta';
import { useAuth } from '@/lib/auth';

/**
 * Favourites, as a report.
 *
 * It lived under User Hub, which made it a page about users. It isn't: every
 * chart on it is about games — which ones people save, and whether saving one
 * turns into playing it. That is the same question Reports asks everywhere
 * else, and it belongs next to the answers it should be read against.
 *
 * The move also fixes what the separation cost. Reports colours every game from
 * the backend registry; this page had its own rotating ten-colour array, so
 * Grid was orange on one page and whatever-came-fourth on this one. Same games,
 * same colours now, joined through the registry's `favourite_slug`.
 *
 * The gate loosens from superuser to staff along the way: these are per-game
 * aggregates like the rest of Reports, not the per-user data User Hub exposes.
 */
export default function FavouritesReportPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const { data, isLoading, error, notDeployed, refetch } = useFavouritesUsage(enabled);
  const trends = useAdoptionTrends(enabled);
  const played = useFavouredVsPlayed(enabled);
  const { meta } = useGameMeta(enabled);
  const favouriteMeta = byFavouriteSlug(meta);

  return (
    <ReportsShell
      title="Favourites"
      description="Which games players save, and whether saving one turns into playing it. A game people favourite but never start is a promise the game isn't keeping."
    >
      {isLoading && <AnalyticsSkeleton />}

      {error && <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />}

      {data && !notDeployed && (
        <>
          <FavouritesUsageSummary data={data} />
          <GamePopularityChart
            gamePopularity={data.game_popularity}
            meta={favouriteMeta}
            // Who favourited it is a question about people, so the drill-through
            // still lands in User Hub — the section that answers it.
            onGameSelect={slug => router.push(`/user-hub/users?favourite_game=${encodeURIComponent(slug)}`)}
          />
          <FavouriteInsights data={data} meta={favouriteMeta} />
        </>
      )}

      {/* Independently guarded — each degrades on its own if its BE endpoint
          isn't deployed yet. */}
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
        meta={favouriteMeta}
        onRetry={played.refetch}
      />
    </ReportsShell>
  );
}
