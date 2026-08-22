import type {
  NationPlayersResponse,
  RosterParams,
  TeamPlayersResponse,
  TeamSearchResult,
} from '@/types/team';
import { apiFetcher } from '@/lib/api-fetcher';

/**
 * Build a `?key=value&...` string from a params object, dropping `undefined`,
 *  `null`, the literal string `'all'`, and empty strings.
 */
function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') {
      continue;
    }
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Admin-only Team lookup endpoints used by the automation app's Team
 * Players feature.
 *
 * - `searchTeams` reuses the public `/data/team/search/` endpoint
 *   (`AllowAny`) for the autocomplete dropdown.
 * - `getTeamPlayers` hits the new admin endpoint that requires
 *   `IsAdminUser` server-side. Caller must be logged in with a staff
 *   JWT (the Bearer header is attached by `apiFetcher`).
 */
export class TeamAPI {
  /** GET /data/team/search/?name=<query> */
  static async searchTeams(name: string): Promise<TeamSearchResult[]> {
    const query = name.trim();
    if (!query) {
      return [];
    }
    return apiFetcher<TeamSearchResult[]>(
      `data/team/search/?name=${encodeURIComponent(query)}`,
    );
  }

  /** GET /data/team/<id>/players/ — admin only. */
  static async getTeamPlayers(
    teamId: number,
    params?: RosterParams,
  ): Promise<TeamPlayersResponse> {
    const qs = buildQuery(params as Record<string, unknown> | undefined);
    return apiFetcher<TeamPlayersResponse>(`data/team/${teamId}/players/${qs}`);
  }

  /**
   * GET /data/nation/<id>/players/ — admin only.
   *
   * Everyone who played for a club in this country, which is a different
   * question from everyone from it. Same rows and the same params as the squad
   * lookup — the backend serves both from one view — so the only difference
   * here is the path.
   */
  static async getNationPlayers(
    nationId: number,
    params?: RosterParams,
  ): Promise<NationPlayersResponse> {
    const qs = buildQuery(params as Record<string, unknown> | undefined);
    return apiFetcher<NationPlayersResponse>(`data/nation/${nationId}/players/${qs}`);
  }
}
