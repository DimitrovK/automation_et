import { describe, expect, it } from 'vitest';
import { initialsFor, prettySlug, suspensionLabel, toChartData } from '@/lib/user-hub-format';

describe('prettySlug', () => {
  it('title-cases a kebab slug', () => {
    expect(prettySlug('avatars-of-football')).toBe('Avatars Of Football');
    expect(prettySlug('grid')).toBe('Grid');
  });

  it('is safe on empty input', () => {
    expect(prettySlug('')).toBe('');
  });
});

describe('toChartData', () => {
  it('sorts by count descending and prettifies labels', () => {
    const rows = toChartData({ 'grid': 2, 'quiz': 5, 'the-scout': 1 });

    expect(rows.map(r => r.slug)).toEqual(['quiz', 'grid', 'the-scout']);
    expect(rows[0]).toEqual({ slug: 'quiz', label: 'Quiz', count: 5 });
    expect(rows[2].label).toBe('The Scout');
  });

  it('returns an empty array for no data', () => {
    expect(toChartData({})).toEqual([]);
  });
});

describe('initialsFor', () => {
  it('uses first + last initials when present', () => {
    expect(initialsFor({ first_name: 'Kalin', last_name: 'Dimitrov', username: 'kd' })).toBe('KD');
  });

  it('falls back to the username when no name', () => {
    expect(initialsFor({ first_name: '', last_name: '', username: 'admin' })).toBe('AD');
  });
});

describe('suspensionLabel', () => {
  it('maps scopes to labels', () => {
    expect(suspensionLabel('FULL_PLATFORM')).toBe('Full suspension');
    expect(suspensionLabel('MULTIPLAYER')).toBe('MP suspended');
    expect(suspensionLabel('ALL_GAMES')).toBe('Games suspended');
  });

  it('returns empty string for no suspension', () => {
    expect(suspensionLabel(null)).toBe('');
  });
});
