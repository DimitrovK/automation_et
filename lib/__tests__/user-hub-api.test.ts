import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetcher } from '@/lib/api-fetcher';
import { UserHubAPI } from '@/lib/user-hub-api';

vi.mock('@/lib/api-fetcher', () => ({
  apiFetcher: vi.fn(),
}));

const mockApiFetcher = vi.mocked(apiFetcher);

describe('UserHubAPI', () => {
  beforeEach(() => mockApiFetcher.mockReset());

  afterEach(() => vi.restoreAllMocks());

  describe('getFavouritesUsage', () => {
    it('hits /accounts/admin/favourites-usage/', async () => {
      const payload = {
        users_with_favourites: 3,
        total_users: 10,
        game_popularity: { grid: 2, quiz: 1 },
        users: [{ id: 1, username: 'a', favourite_games: ['grid'] }],
      };
      mockApiFetcher.mockResolvedValue(payload);

      const result = await UserHubAPI.getFavouritesUsage();

      expect(mockApiFetcher).toHaveBeenCalledWith('accounts/admin/favourites-usage/');
      expect(result).toEqual(payload);
    });

    it('propagates apiFetcher errors (e.g. 404 before deploy)', async () => {
      mockApiFetcher.mockRejectedValueOnce(new Error('404 Not Found'));

      await expect(UserHubAPI.getFavouritesUsage()).rejects.toThrow('404 Not Found');
    });
  });

  describe('listUsers', () => {
    it('hits /accounts/users/ with no params', async () => {
      mockApiFetcher.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
      await UserHubAPI.listUsers();

      expect(mockApiFetcher).toHaveBeenCalledWith('accounts/users/');
    });

    it('serialises params and drops undefined/empty', async () => {
      mockApiFetcher.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
      await UserHubAPI.listUsers({ search: 'kalin', ordering: '-id', page: 2 });

      const url = mockApiFetcher.mock.calls[0][0] as string;

      expect(url.startsWith('accounts/users/?')).toBe(true);
      expect(url).toContain('search=kalin');
      expect(url).toContain('ordering=-id');
      expect(url).toContain('page=2');
    });

    it('omits an empty search term', async () => {
      mockApiFetcher.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
      await UserHubAPI.listUsers({ search: '', ordering: 'id', page: 1 });
      const url = mockApiFetcher.mock.calls[0][0] as string;

      expect(url).not.toContain('search=');
      expect(url).toContain('ordering=id');
    });
  });

  describe('getUser / getUserRankings', () => {
    it('hits /accounts/users/{id}/', async () => {
      mockApiFetcher.mockResolvedValue({ id: 5 });
      await UserHubAPI.getUser(5);

      expect(mockApiFetcher).toHaveBeenCalledWith('accounts/users/5/');
    });

    it('hits /accounts/users/{id}/rankings/', async () => {
      mockApiFetcher.mockResolvedValue({});
      await UserHubAPI.getUserRankings(5);

      expect(mockApiFetcher).toHaveBeenCalledWith('accounts/users/5/rankings/');
    });
  });
});
