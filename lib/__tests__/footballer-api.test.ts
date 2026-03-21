import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FootballerAPI } from '@/lib/footballer-api';

// Mock the apiFetcher module
vi.mock('@/lib/api-fetcher', () => ({
  apiFetcher: vi.fn(),
}));

import { apiFetcher } from '@/lib/api-fetcher';

const mockApiFetcher = vi.mocked(apiFetcher);

describe('FootballerAPI — Position Methods', () => {
  beforeEach(() => {
    mockApiFetcher.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPositions', () => {
    it('calls GET /data/positions/', async () => {
      const mockPositions = [
        { id: 1, name: 'GK', full_name: 'Goalkeeper', role: 'GK', sort_order: 1 },
        { id: 2, name: 'CB', full_name: 'Centre-Back', role: 'DEF', sort_order: 2 },
      ];
      mockApiFetcher.mockResolvedValue(mockPositions);

      const result = await FootballerAPI.getPositions();

      expect(mockApiFetcher).toHaveBeenCalledWith('data/positions/');
      expect(result).toEqual(mockPositions);
    });

    it('returns typed Position array', async () => {
      const mockPositions = [
        { id: 1, name: 'GK', full_name: 'Goalkeeper', role: 'GK', sort_order: 1 },
      ];
      mockApiFetcher.mockResolvedValue(mockPositions);

      const result = await FootballerAPI.getPositions();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', 'GK');
      expect(result[0]).toHaveProperty('full_name', 'Goalkeeper');
      expect(result[0]).toHaveProperty('role', 'GK');
    });
  });

  describe('getFootballerPositions', () => {
    it('calls GET with footballer query param', async () => {
      const mockPositions = [
        {
          id: 10, footballer_id: 42, footballer_name: 'Lionel Messi',
          position_id: 16, position_name: 'RW', position_full_name: 'Right Winger',
          position_role: 'FWD', is_primary: true, sort_order: 0,
          created_at: '2026-01-01', updated_at: '2026-01-01',
        },
      ];
      mockApiFetcher.mockResolvedValue(mockPositions);

      const result = await FootballerAPI.getFootballerPositions(42);

      expect(mockApiFetcher).toHaveBeenCalledWith('data/footballer-positions/?footballer=42');
      expect(result).toEqual(mockPositions);
    });

    it('passes different footballer IDs correctly', async () => {
      mockApiFetcher.mockResolvedValue([]);

      await FootballerAPI.getFootballerPositions(999);

      expect(mockApiFetcher).toHaveBeenCalledWith('data/footballer-positions/?footballer=999');
    });
  });

  describe('setPositions', () => {
    it('calls POST with correct body', async () => {
      const request = {
        footballer_id: 42,
        positions: [
          { position_id: 16, is_primary: true, sort_order: 0 },
          { position_id: 5, is_primary: false, sort_order: 1 },
        ],
      };
      const mockResponse = [
        {
          id: 10, footballer_id: 42, footballer_name: 'Lionel Messi',
          position_id: 16, position_name: 'RW', position_full_name: 'Right Winger',
          position_role: 'FWD', is_primary: true, sort_order: 0,
          created_at: '2026-01-01', updated_at: '2026-01-01',
        },
        {
          id: 11, footballer_id: 42, footballer_name: 'Lionel Messi',
          position_id: 5, position_name: 'CF', position_full_name: 'Centre-Forward',
          position_role: 'FWD', is_primary: false, sort_order: 1,
          created_at: '2026-01-01', updated_at: '2026-01-01',
        },
      ];
      mockApiFetcher.mockResolvedValue(mockResponse);

      const result = await FootballerAPI.setPositions(request);

      expect(mockApiFetcher).toHaveBeenCalledWith('data/footballer-positions/set-positions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      expect(result).toHaveLength(2);
    });

    it('sends empty positions array to clear all', async () => {
      const request = {
        footballer_id: 42,
        positions: [],
      };
      mockApiFetcher.mockResolvedValue([]);

      const result = await FootballerAPI.setPositions(request);

      expect(mockApiFetcher).toHaveBeenCalledWith('data/footballer-positions/set-positions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      expect(result).toEqual([]);
    });

    it('propagates API errors', async () => {
      mockApiFetcher.mockRejectedValue(new Error('Insufficient permissions'));

      await expect(
        FootballerAPI.setPositions({ footballer_id: 42, positions: [] }),
      ).rejects.toThrow('Insufficient permissions');
    });
  });
});
