import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetcher } from '@/lib/api-fetcher';
import { ReportsAPI } from '@/lib/reports-api';

vi.mock('@/lib/api-fetcher', () => ({ apiFetcher: vi.fn() }));

const mockApiFetcher = vi.mocked(apiFetcher);

describe('reportsAPI', () => {
  beforeEach(() => {
    mockApiFetcher.mockReset();
    mockApiFetcher.mockResolvedValue({} as never);
  });

  it('hits the reporting paths, not the feedback reports viewset', async () => {
    // `core/reports/` is the user-feedback Report viewset — a typo here would
    // silently query tickets instead of analytics.
    await ReportsAPI.getSummary();
    await ReportsAPI.getActivity();
    await ReportsAPI.getMultiplayer();
    await ReportsAPI.getTopPlayers();

    expect(mockApiFetcher.mock.calls.map(call => call[0])).toEqual([
      'core/reporting/summary/',
      'core/reporting/activity/',
      'core/reporting/multiplayer/',
      'core/reporting/top-players/',
    ]);
  });

  it('exposes the game-metadata endpoint', async () => {
    // Colours come from here rather than a frontend palette, which would drift
    // the first time a game is added.
    await ReportsAPI.getGames();

    expect(mockApiFetcher).toHaveBeenCalledWith('core/reporting/games/');
  });

  it('passes game_type through so a badge click filters server-side', async () => {
    await ReportsAPI.getSummary({ window: 30, game_type: 'team_ties' });

    expect(mockApiFetcher).toHaveBeenCalledWith(
      'core/reporting/summary/?window=30&game_type=team_ties',
    );
  });

  it('serialises params into a query string', async () => {
    await ReportsAPI.getTopPlayers({ window: 30, include_bots: true, limit: 25 });

    expect(mockApiFetcher).toHaveBeenCalledWith(
      'core/reporting/top-players/?window=30&include_bots=true&limit=25',
    );
  });

  it('sends include_bots=false explicitly rather than dropping it', async () => {
    // The BE echoes resolved filters back; sending the flag keeps request and
    // response readable side by side instead of relying on a default.
    await ReportsAPI.getActivity({ window: 7, include_bots: false });

    expect(mockApiFetcher).toHaveBeenCalledWith(
      'core/reporting/activity/?window=7&include_bots=false',
    );
  });

  it('omits undefined params', async () => {
    await ReportsAPI.getSummary({ window: 7, game_type: undefined });

    expect(mockApiFetcher).toHaveBeenCalledWith('core/reporting/summary/?window=7');
  });
});
