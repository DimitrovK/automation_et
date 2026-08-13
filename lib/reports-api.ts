import type {
  ActivityResponse,
  AnomaliesResponse,
  DurationResponse,
  GamesResponse,
  GlossaryResponse,
  MultiplayerResponse,
  PatternsResponse,
  PlayerDetailResponse,
  ReportParams,
  RetentionResponse,
  RollupHealth,
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

  /** GET /core/reporting/rollup-health/ — is the rollup complete and current. */
  static async getRollupHealth(): Promise<RollupHealth> {
    return apiFetcher<RollupHealth>('core/reporting/rollup-health/');
  }

  /** GET /core/reporting/glossary/ — what every reported number means. */
  static async getGlossary(): Promise<GlossaryResponse> {
    return apiFetcher<GlossaryResponse>('core/reporting/glossary/');
  }

  /** GET /core/reporting/anomalies/ — what moved enough to be worth attention. */
  static async getAnomalies(params?: ReportParams): Promise<AnomaliesResponse> {
    return apiFetcher<AnomaliesResponse>(`core/reporting/anomalies/${buildQuery(params)}`);
  }

  /** GET /core/reporting/duration/ — median session length per game. */
  static async getDuration(params?: ReportParams): Promise<DurationResponse> {
    return apiFetcher<DurationResponse>(`core/reporting/duration/${buildQuery(params)}`);
  }

  /** GET /core/reporting/patterns/ — when people play + new vs returning. */
  static async getPatterns(params?: ReportParams): Promise<PatternsResponse> {
    return apiFetcher<PatternsResponse>(`core/reporting/patterns/${buildQuery(params)}`);
  }

  /** GET /core/reporting/players/{id}/ — one player's activity. */
  static async getPlayerDetail(userId: number, params?: ReportParams): Promise<PlayerDetailResponse> {
    return apiFetcher<PlayerDetailResponse>(`core/reporting/players/${userId}/${buildQuery(params)}`);
  }

  /** GET /core/reporting/retention/ — D1/D7/D30 cohort retention. */
  static async getRetention(params?: ReportParams): Promise<RetentionResponse> {
    return apiFetcher<RetentionResponse>(`core/reporting/retention/${buildQuery(params)}`);
  }

  /** GET /core/reporting/top-players/ — busiest players over the window. */
  static async getTopPlayers(params?: ReportParams): Promise<TopPlayersResponse> {
    return apiFetcher<TopPlayersResponse>(`core/reporting/top-players/${buildQuery(params)}`);
  }
}
