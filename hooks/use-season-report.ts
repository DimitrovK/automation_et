import type { UseReport } from '@/hooks/use-report';
import type { SeasonReport } from '@/types/reports';
import { useReport } from '@/hooks/use-report';
import { ReportsAPI } from '@/lib/reports-api';

/**
 * One season from the backend's Season dashboard read (App#2604). `null` asks
 * for the season in focus on the Django admin dashboard. The number is the
 * resource key: the endpoint takes no range filters.
 */
export function useSeasonReport(season: number | null, enabled: boolean): UseReport<SeasonReport> {
  return useReport(
    () => ReportsAPI.getSeason(season ?? undefined),
    {},
    enabled,
    'The season reporting endpoint',
    season === null ? 'focus' : String(season),
  );
}
