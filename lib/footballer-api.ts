import type {
  CreateFootballerNationRequest,
  CreateFootballerRequest,
  CreateFootballerTeamRequest,
  Footballer,
  FootballerBulkUpdateResponse,
  FootballerBulkUpdates,
  FootballerIncludeToken,
  FootballerNation,
  FootballerNationStat,
  FootballerPicture,
  FootballerPosition,
  FootballersResponse,
  FootballerTeam,
  FootballerTeamsResponse,
  Position,
  SetPositionsRequest,
} from '@/types/player';
import config from '@/lib/config';
import { apiFetcher } from '@/lib/api-fetcher';

/**
 * API service for Django footballer endpoints
 */
export class FootballerAPI {
  private static readonly BASE_PATH = 'data/footballers';

  /**
   * Get all footballers (paginated)
   * GET /data/footballers/
   */
  static async getFootballers(params?: Record<string, string | number>): Promise<FootballersResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
    }

    const url = searchParams.toString()
      ? `${this.BASE_PATH}/?${searchParams.toString()}`
      : `${this.BASE_PATH}/`;

    return apiFetcher(url);
  }

  /**
   * Get a single footballer by ID
   * GET /data/footballers/{id}/[?include=...]
   *
   * Pass an array of include tokens (``teams``, ``nations``,
   * ``positions``, ``pictures``) to expand nested relations in one
   * round trip — used by the modernised Update flow.
   */
  static async getFootballer(
    id: number,
    include?: FootballerIncludeToken[],
  ): Promise<Footballer> {
    const qs = include && include.length > 0 ? `?include=${include.join(',')}` : '';
    return apiFetcher<Footballer>(`${this.BASE_PATH}/${id}/${qs}`);
  }

  /**
   * Bulk-update a fixed allowlist of fields on many footballers.
   * POST /data/footballers/bulk-update/
   * @returns count of rows updated + the applied diff
   */
  static async bulkUpdateFootballers(
    ids: number[],
    updates: FootballerBulkUpdates,
  ): Promise<FootballerBulkUpdateResponse> {
    return apiFetcher<FootballerBulkUpdateResponse>(
      `${this.BASE_PATH}/bulk-update/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates }),
      },
    );
  }

  /**
   * Create a new footballer
   * POST /data/footballers/
   */
  static async createFootballer(data: CreateFootballerRequest): Promise<Footballer> {
    return apiFetcher(`${this.BASE_PATH}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a footballer by ID
   * PUT /data/footballers/{id}/
   */
  static async updateFootballer(id: number, data: CreateFootballerRequest): Promise<Footballer> {
    return apiFetcher(`${this.BASE_PATH}/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a footballer by ID
   * DELETE /data/footballers/{id}/
   */
  static async deleteFootballer(id: number): Promise<void> {
    return apiFetcher(`${this.BASE_PATH}/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all nations
   * GET /data/nations/
   */
  static async getNations(): Promise<FootballerNation[]> {
    return apiFetcher('data/nations/');
  }

  /**
   * Get footballer teams by footballer ID
   * GET /data/footballer-teams/?footballer={footballer_id}
   */
  static async getFootballerTeams(footballerId: number): Promise<FootballerTeamsResponse> {
    return apiFetcher(`data/footballer-teams/?footballer=${footballerId}`);
  }

  /**
   * Create a new footballer team record
   * POST /data/footballer-teams/
   */
  static async createFootballerTeam(data: CreateFootballerTeamRequest): Promise<FootballerTeam> {
    return apiFetcher('data/footballer-teams/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a footballer team record by ID
   * PUT /data/footballer-teams/{id}/
   */
  static async updateFootballerTeam(id: number, data: Partial<CreateFootballerTeamRequest>): Promise<FootballerTeam> {
    return apiFetcher(`data/footballer-teams/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Partially update a footballer team record by ID
   * PATCH /data/footballer-teams/{id}/
   */
  static async patchFootballerTeam(id: number, data: Partial<FootballerTeam>): Promise<FootballerTeam> {
    return apiFetcher(`data/footballer-teams/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a footballer team record by ID
   * DELETE /data/footballer-teams/{id}/
   */
  static async deleteFootballerTeam(id: number): Promise<void> {
    return apiFetcher(`data/footballer-teams/${id}/`, {
      method: 'DELETE',
    });
  }

  // ── Footballer Nation Stats ──────────────────────────────

  /**
   * Get footballer nation stats by footballer ID
   * GET /data/footballer-nations/?footballer={footballer_id}
   */
  static async getFootballerNations(footballerId: number): Promise<FootballerNationStat[]> {
    return apiFetcher(`data/footballer-nations/?footballer=${footballerId}`);
  }

  /**
   * Create a new footballer nation stat record
   * POST /data/footballer-nations/
   */
  static async createFootballerNation(data: CreateFootballerNationRequest): Promise<FootballerNationStat> {
    return apiFetcher('data/footballer-nations/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a footballer nation stat record by ID
   * PUT /data/footballer-nations/{id}/
   */
  static async updateFootballerNation(id: number, data: CreateFootballerNationRequest): Promise<FootballerNationStat> {
    return apiFetcher(`data/footballer-nations/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a footballer nation stat record by ID
   * DELETE /data/footballer-nations/{id}/
   */
  static async deleteFootballerNation(id: number): Promise<void> {
    return apiFetcher(`data/footballer-nations/${id}/`, {
      method: 'DELETE',
    });
  }

  // ── Footballer (raw) update helpers ──────────────────────────

  /** Partial update via PATCH — used when only a few fields change. */
  static async patchFootballer(
    id: number,
    updates: Partial<CreateFootballerRequest>,
  ): Promise<Footballer> {
    return apiFetcher<Footballer>(`${this.BASE_PATH}/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  // ── Positions ────────────────────────────────────────────────

  /** GET /data/positions/ — reference list of all 16 positions. */
  static async getPositions(): Promise<Position[]> {
    return apiFetcher<Position[]>('data/positions/');
  }

  /** GET /data/footballer-positions/?footballer={id} (AllowAny for GET). */
  static async getFootballerPositions(
    footballerId: number,
  ): Promise<FootballerPosition[]> {
    return apiFetcher<FootballerPosition[]>(
      `data/footballer-positions/?footballer=${footballerId}`,
    );
  }

  /**
   * POST /data/footballer-positions/set-positions/ — admin-only.
   * Atomically replaces the footballer's full position set. Pass an
   * empty positions array to clear them all.
   */
  static async setPositions(data: SetPositionsRequest): Promise<FootballerPosition[]> {
    return apiFetcher<FootballerPosition[]>(
      'data/footballer-positions/set-positions/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
  }

  // ── Pictures ─────────────────────────────────────────────────

  /** GET /data/footballer-pictures/?footballer={id}&is_active=... */
  static async getFootballerPictures(
    footballerId: number,
    onlyActive = false,
  ): Promise<FootballerPicture[]> {
    const params = new URLSearchParams({ footballer: String(footballerId) });
    if (onlyActive) params.set('is_active', 'true');
    return apiFetcher<FootballerPicture[]>(`data/footballer-pictures/?${params.toString()}`);
  }

  /**
   * POST /data/footballer-pictures/ — multipart upload.
   *
   * apiFetcher hard-codes ``Content-Type: application/json`` so we
   * can't reuse it for multipart (the boundary header would be
   * stomped). Build the request inline using ``fetch`` with the same
   * Bearer token apiFetcher uses, but let the browser set the
   * multipart boundary itself.
   */
  static async uploadFootballerPicture(
    footballerId: number,
    name: string,
    file: File,
  ): Promise<FootballerPicture> {
    const form = new FormData();
    form.append('footballer_id', String(footballerId));
    form.append('name', name);
    form.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(config.getApiUrl('data/footballer-pictures/'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText} (POST data/footballer-pictures/)`;
      try {
        const data = await response.json();
        if (typeof data?.detail === 'string') message = data.detail;
        else if (typeof data?.error === 'string') message = data.error;
      } catch {
        // keep the default message
      }
      throw new Error(message);
    }
    return (await response.json()) as FootballerPicture;
  }

  /** PATCH /data/footballer-pictures/{id}/ — toggle is_active or rename. */
  static async patchFootballerPicture(
    id: number,
    updates: Partial<Pick<FootballerPicture, 'name' | 'is_active'>>,
  ): Promise<FootballerPicture> {
    return apiFetcher<FootballerPicture>(`data/footballer-pictures/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  /** DELETE /data/footballer-pictures/{id}/ */
  static async deleteFootballerPicture(id: number): Promise<void> {
    return apiFetcher<void>(`data/footballer-pictures/${id}/`, { method: 'DELETE' });
  }
}
