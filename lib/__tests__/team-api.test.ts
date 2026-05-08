import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-fetcher', () => ({
  apiFetcher: vi.fn(),
}));

import { apiFetcher } from '@/lib/api-fetcher';
import { TeamAPI } from '@/lib/team-api';

const mockApiFetcher = vi.mocked(apiFetcher);

describe('TeamAPI', () => {
  beforeEach(() => mockApiFetcher.mockReset());
  afterEach(() => vi.restoreAllMocks());

  // ---- searchTeams ----------------------------------------------------

  describe('searchTeams', () => {
    it('hits /data/team/search/?name=<encoded>', async () => {
      mockApiFetcher.mockResolvedValue([{ id: 1, name: 'AC Milan' }]);

      const result = await TeamAPI.searchTeams('AC Milan');

      expect(mockApiFetcher).toHaveBeenCalledWith('data/team/search/?name=AC%20Milan');
      expect(result).toEqual([{ id: 1, name: 'AC Milan' }]);
    });

    it('returns [] without hitting the network for empty queries', async () => {
      const result = await TeamAPI.searchTeams('   ');
      expect(result).toEqual([]);
      expect(mockApiFetcher).not.toHaveBeenCalled();
    });

    it('encodes special characters in the query', async () => {
      mockApiFetcher.mockResolvedValue([]);
      await TeamAPI.searchTeams('Real Madrid & Co');
      expect(mockApiFetcher).toHaveBeenCalledWith(
        'data/team/search/?name=Real%20Madrid%20%26%20Co',
      );
    });
  });

  // ---- getTeamPlayers -------------------------------------------------

  describe('getTeamPlayers', () => {
    const happy = {
      team: {
        id: 7, name: 'AC Milan', nation_name: 'Italy', nation_short: 'ITA',
        founding_year: 1899, parent_team_name: null,
        total_players: 100, total_managers: 20,
      },
      players: { count: 0, next: null, previous: null, results: [] },
    };

    it('builds /data/team/<id>/players/ with no params', async () => {
      mockApiFetcher.mockResolvedValue(happy);
      await TeamAPI.getTeamPlayers(7);
      expect(mockApiFetcher).toHaveBeenCalledWith('data/team/7/players/');
    });

    it('serialises params and drops "all" / undefined / empty', async () => {
      mockApiFetcher.mockResolvedValue(happy);
      await TeamAPI.getTeamPlayers(7, {
        role: 'player',
        transfer_type: 'all',     // dropped
        status: 'retired',
        q: '',                    // dropped
        ordering: '-start_year',
        page: 2,
        page_size: 50,
        nation_id: undefined,     // dropped
      });

      const url = mockApiFetcher.mock.calls[0][0] as string;
      // Order is set by URLSearchParams insertion order; assert key/value pairs.
      expect(url.startsWith('data/team/7/players/?')).toBe(true);
      expect(url).toContain('role=player');
      expect(url).toContain('status=retired');
      expect(url).toContain('ordering=-start_year');
      expect(url).toContain('page=2');
      expect(url).toContain('page_size=50');
      expect(url).not.toContain('transfer_type');
      expect(url).not.toContain('q=');
      expect(url).not.toContain('nation_id');
    });

    it('propagates apiFetcher errors', async () => {
      mockApiFetcher.mockRejectedValueOnce(new Error('Forbidden — staff only.'));
      await expect(TeamAPI.getTeamPlayers(7)).rejects.toThrow('Forbidden — staff only.');
    });
  });
});
