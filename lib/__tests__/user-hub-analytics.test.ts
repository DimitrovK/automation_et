import type { FavouritesUsageResponse, FavouritesUsageUser } from '@/types/user-hub';
import { describe, expect, it } from 'vitest';
import {
  avgFavouritesPerUser,
  favouriteDepthDistribution,
  favouritesToCsv,
  firstChoiceCounts,
} from '@/lib/user-hub-analytics';

function user(id: number, favourite_games: string[]): FavouritesUsageUser {
  return { id, username: `u${id}`, favourite_games };
}

const USERS: FavouritesUsageUser[] = [
  user(1, ['grid', 'quiz']),
  user(2, ['grid']),
  user(3, ['quiz', 'grid', 'the-scout']),
  user(4, []),
];

function response(users: FavouritesUsageUser[]): FavouritesUsageResponse {
  const withFav = users.filter(u => u.favourite_games.length > 0).length;
  return { users_with_favourites: withFav, total_users: users.length, game_popularity: {}, users };
}

describe('avgFavouritesPerUser', () => {
  it('averages over users who have favourites', () => {
    // (2 + 1 + 3) / 3 = 2
    expect(avgFavouritesPerUser(response(USERS))).toBe(2);
  });

  it('is 0 when nobody has favourites', () => {
    expect(avgFavouritesPerUser(response([user(1, [])]))).toBe(0);
  });
});

describe('firstChoiceCounts', () => {
  it('counts #1 picks and sorts desc', () => {
    // first picks: grid, grid, quiz → grid:2, quiz:1
    const rows = firstChoiceCounts(USERS);

    expect(rows[0]).toEqual({ slug: 'grid', label: 'Grid', count: 2 });
    expect(rows[1]).toEqual({ slug: 'quiz', label: 'Quiz', count: 1 });
  });
});

describe('favouriteDepthDistribution', () => {
  it('buckets favourite counts', () => {
    const dist = favouriteDepthDistribution(USERS);

    expect(dist.find(d => d.bucket === '1')?.count).toBe(1); // user 2
    expect(dist.find(d => d.bucket === '2')?.count).toBe(1); // user 1
    expect(dist.find(d => d.bucket === '3')?.count).toBe(1); // user 3
    expect(dist.find(d => d.bucket === '5+')?.count).toBe(0);
  });
});

describe('favouritesToCsv', () => {
  it('emits a header + one row per user, escaping cells', () => {
    const csv = favouritesToCsv([user(1, ['grid', 'quiz']), { id: 2, username: 'a,b', favourite_games: [] }]);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('id,username,favourite_count,favourite_games');
    expect(lines[1]).toBe('1,u1,2,grid|quiz');
    expect(lines[2]).toBe('2,"a,b",0,');
  });
});
