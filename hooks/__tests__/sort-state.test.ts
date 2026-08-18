import { describe, expect, it } from 'vitest';
import { sortState } from '@/hooks/use-ranked-table';

describe('sortState', () => {
  it('reads the interesting direction as descending', () => {
    expect(sortState('players', 'players')).toBe('descending');
    expect(sortState('footballers', 'footballers')).toBe('descending');
  });

  it('reads the _asc variant as ascending', () => {
    expect(sortState('players_asc', 'players')).toBe('ascending');
    expect(sortState('footballers_asc', 'footballers')).toBe('ascending');
  });

  it('reads name as ascending, since A–Z is its only direction', () => {
    // The one column that breaks the "bare ordering means descending" rule.
    // Calling it descending would draw an arrow pointing the wrong way.
    expect(sortState('name', 'name')).toBe('ascending');
  });

  it('says nothing about a column that is not the one in force', () => {
    // `aria-sort` on more than one column would claim the table is sorted by
    // both, which is how a screen reader gets told the opposite of the truth.
    expect(sortState('players', 'name')).toBeUndefined();
    expect(sortState('name', 'players')).toBeUndefined();
    expect(sortState('players_asc', 'name')).toBeUndefined();
  });
});
