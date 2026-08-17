import { describe, expect, it } from 'vitest';
import { parseTeamId } from '@/lib/team-id-param';

describe('parseTeamId', () => {
  it('reads a team id out of the query string', () => {
    expect(parseTeamId('1042')).toBe(1042);
  });

  it('ignores a missing parameter', () => {
    // The page is still reachable without one — the search box is the other
    // way in, and an absent id must not be read as a request for team NaN.
    expect(parseTeamId(null)).toBeNull();
    expect(parseTeamId(undefined)).toBeNull();
    expect(parseTeamId('')).toBeNull();
  });

  it('refuses anything that is not a whole positive number', () => {
    // Straight into a `/data/team/<id>/players/` path, so a value that is not
    // an id is a request that can only 404 — and the page renders that 404 as
    // "the backend may not be deployed", which is a confusing lie about a typo.
    for (const raw of ['abc', '12abc', '0', '-3', '1.5', 'Infinity', 'NaN']) {
      expect(parseTeamId(raw), raw).toBeNull();
    }
  });

  it('tolerates the whitespace a copied-and-pasted id arrives with', () => {
    expect(parseTeamId(' 7 ')).toBe(7);
  });
});
