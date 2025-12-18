import type {
  CreateFootballerRequest,
  CreateFootballerTeamRequest,
  Footballer,
  FootballerNation,
  FootballersResponse,
  FootballerTeam,
  FootballerTeamsResponse,
} from '@/types/player';
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
   * GET /data/footballers/{id}/
   */
  static async getFootballer(id: number): Promise<Footballer> {
    return apiFetcher(`${this.BASE_PATH}/${id}/`);
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
}
