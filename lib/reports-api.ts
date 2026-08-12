import type {
  ActivityResponse,
  GamesResponse,
  MultiplayerResponse,
  ReportParams,
  SummaryResponse,
  TopPlayersResponse,
} from '@/types/reports';
import { apiFetcher } from '@/lib/api-fetcher';

/**
 * Build `?key=value&...`, dropping undefined/null/empty. Mirrors `user-hub-api`.
 * `include_bots` is passed through even when false: the BE echoes the resolved
 * filters back, and being explicit keeps request and response readable together.
 */
function buildQuery(params?: ReportParams): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Staff-only platform reporting (`IsAdminUser` server-side; the Bearer JWT is
 * attached by `apiFetcher`). Read-only — there is intentionally no write method.
 */
export class ReportsAPI {
  /** GET /core/reporting/summary/ — daily pulse + per-game breakdown. */
  static async getSummary(params?: ReportParams): Promise<SummaryResponse> {
    return apiFetcher<SummaryResponse>(`core/reporting/summary/${buildQuery(params)}`);
  }

  /** GET /core/reporting/activity/ — per-day series, zero-filled. */
  static async getActivity(params?: ReportParams): Promise<ActivityResponse> {
    return apiFetcher<ActivityResponse>(`core/reporting/activity/${buildQuery(params)}`);
  }

  /** GET /core/reporting/multiplayer/ — room funnel (rooms, not participations). */
  static async getMultiplayer(params?: ReportParams): Promise<MultiplayerResponse> {
    return apiFetcher<MultiplayerResponse>(`core/reporting/multiplayer/${buildQuery(params)}`);
  }

  /**
   * GET /core/reporting/games/ — key, label and colour per registered game.
   * Colours come from the BE registry so the frontend never keeps its own
   * palette, which would drift the first time a game is added.
   */
  static async getGames(): Promise<GamesResponse> {
    return apiFetcher<GamesResponse>('core/reporting/games/');
  }

  /** GET /core/reporting/top-players/ — busiest players over the window. */
  static async getTopPlayers(params?: ReportParams): Promise<TopPlayersResponse> {
    return apiFetcher<TopPlayersResponse>(`core/reporting/top-players/${buildQuery(params)}`);
  }
}
