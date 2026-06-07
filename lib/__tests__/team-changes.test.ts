import type { FootballerTeam, Team } from '@/types/player';
import { describe, expect, it } from 'vitest';
import { computeTeamChanges } from '@/lib/team-changes';

const makeWiki = (overrides: Partial<Team> = {}): Team => ({
  teamName: 'Arsenal',
  originalTeamName: 'Arsenal FC',
  appearances: 42,
  goals: 15,
  joinYear: 2015,
  departYear: 2018,
  position: 'FW',
  playerName: 'Test Player',
  dateOfBirth: '1990-01-01',
  teamFound: true,
  teamID: 12345,
  typeOfTransfer: 'Permanent',
  ...overrides,
});

const makeDb = (overrides: Partial<FootballerTeam> = {}): FootballerTeam => ({
  id: 1,
  footballer_id: 99,
  footballer_name: 'Test Player',
  team_id: 12345,
  team_name: 'Arsenal',
  role: 'player',
  apps: 42,
  goals: 15,
  transfer_type: 'permanent',
  start_year: 2015,
  end_year: 2018,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('computeTeamChanges', () => {
  it('emits no updates / creates / deletes when wiki and DB match by team_id', () => {
    const result = computeTeamChanges([makeWiki()], [makeDb()], 99);

    expect(result.updates).toEqual([]);
    expect(result.creates).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  it('matches by team_id regardless of array order — no spurious update', () => {
    const wiki = [
      makeWiki({ teamID: 1, teamName: 'Arsenal', joinYear: 2010 }),
      makeWiki({ teamID: 2, teamName: 'Chelsea', joinYear: 2015 }),
    ];
    const db = [
      makeDb({ id: 22, team_id: 2, team_name: 'Chelsea', start_year: 2015 }),
      makeDb({ id: 11, team_id: 1, team_name: 'Arsenal', start_year: 2010 }),
    ];
    const result = computeTeamChanges(wiki, db, 99);

    expect(result.updates).toEqual([]);
    expect(result.creates).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  it('detects an update when apps differ on the same team_id', () => {
    const result = computeTeamChanges(
      [makeWiki({ appearances: 50 })],
      [makeDb({ apps: 42 })],
      99,
    );

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].changes.apps).toBe(50);
    // team_id + role echoed back to satisfy DRF serializer required fields.
    expect(result.updates[0].changes.team_id).toBe(12345);
    expect(result.updates[0].changes.role).toBe('player');
  });

  it('echoes start_year and end_year on update to prevent null-overwrites', () => {
    const result = computeTeamChanges(
      [makeWiki({ goals: 20 })],
      [makeDb({ goals: 15, start_year: 2015, end_year: 2018 })],
      99,
    );

    expect(result.updates[0].changes.goals).toBe(20);
    expect(result.updates[0].changes.start_year).toBe(2015);
    expect(result.updates[0].changes.end_year).toBe(2018);
  });

  it('treats a role mismatch as delete+create (composite key includes role)', () => {
    // Wiki always emits role='player' (manager career is tracked separately).
    // A DB row with role='manager' at the same (team, year, transfer_type) is a
    // distinct record — the BE allows player and manager rows to coexist. Don't
    // silently mutate the manager row; emit delete+create so the operator sees
    // both operations in the deploy console.
    const result = computeTeamChanges(
      [makeWiki({ appearances: 10 })],
      [makeDb({ id: 7, role: 'manager', apps: 5 })],
      99,
    );

    expect(result.updates).toEqual([]);
    expect(result.creates).toHaveLength(1);
    expect(result.creates[0].teamData.role).toBe('player');
    expect(result.deletes).toHaveLength(1);
    expect(result.deletes[0].id).toBe(7);
  });

  it('echoes role from the existing DB row on update (same role both sides)', () => {
    // The common case — wiki and DB both role='player'. role is still echoed
    // back on update so DRF accepts the PUT.
    const result = computeTeamChanges(
      [makeWiki({ appearances: 10 })],
      [makeDb({ role: 'player', apps: 5 })],
      99,
    );

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].changes.role).toBe('player');
  });

  it('detects a create when wiki has a team_id absent in DB', () => {
    const result = computeTeamChanges(
      [makeWiki({ teamID: 999, teamName: 'New Club' })],
      [makeDb({ team_id: 12345, team_name: 'Arsenal' })],
      99,
    );

    expect(result.creates).toHaveLength(1);
    expect(result.creates[0].teamData.team_id).toBe(999);
    expect(result.creates[0].teamData.footballer_id).toBe(99);
    // DB-only row stays — gets a delete.
    expect(result.deletes).toHaveLength(1);
    expect(result.deletes[0].teamName).toBe('Arsenal');
  });

  it('detects a delete when DB has a team_id absent in wiki', () => {
    const result = computeTeamChanges(
      [makeWiki({ teamID: 1, teamName: 'Arsenal' })],
      [
        makeDb({ id: 10, team_id: 1, team_name: 'Arsenal' }),
        makeDb({ id: 20, team_id: 99, team_name: 'Stale Club' }),
      ],
      99,
    );

    expect(result.deletes).toHaveLength(1);
    expect(result.deletes[0].id).toBe(20);
    expect(result.deletes[0].teamName).toBe('Stale Club');
  });

  it('skips wiki teams without a teamID (n8n could not resolve the club)', () => {
    const result = computeTeamChanges(
      [makeWiki({ teamFound: false, teamID: null })],
      [],
      99,
    );

    expect(result.creates).toEqual([]);
    expect(result.updates).toEqual([]);
  });

  // --- Deletes-safety when wiki has unresolvable rows ---

  it('flags hadUnresolvedWikiRows=true when ANY wiki row has teamFound=false', () => {
    const result = computeTeamChanges(
      [
        makeWiki({ teamID: 1, teamName: 'Arsenal' }),
        makeWiki({ teamFound: false, teamID: null, teamName: 'Some Club' }),
      ],
      [makeDb({ id: 10, team_id: 1, team_name: 'Arsenal' })],
      99,
    );

    expect(result.hadUnresolvedWikiRows).toBe(true);
  });

  it('flags hadUnresolvedWikiRows=false when every wiki row resolves', () => {
    const result = computeTeamChanges(
      [makeWiki({ teamID: 1, teamFound: true })],
      [makeDb({ team_id: 1 })],
      99,
    );

    expect(result.hadUnresolvedWikiRows).toBe(false);
  });

  it('suppresses deletes entirely when an unresolved wiki row exists (avoids destroying DB rows that may match it)', () => {
    // Wiki has Arsenal (resolved) + an unresolved spell. DB has Arsenal and a
    // mystery row that COULD correspond to the unresolved wiki spell — we
    // can't tell, so we must not emit a delete for it.
    const result = computeTeamChanges(
      [
        makeWiki({ teamID: 1, teamName: 'Arsenal' }),
        makeWiki({ teamFound: false, teamID: null, teamName: 'Unparsed Loan' }),
      ],
      [
        makeDb({ id: 10, team_id: 1, team_name: 'Arsenal' }),
        makeDb({ id: 20, team_id: 99, team_name: 'Mystery Club' }),
      ],
      99,
    );

    expect(result.hadUnresolvedWikiRows).toBe(true);
    expect(result.deletes).toEqual([]);
  });

  it('still emits deletes normally when all wiki rows resolve', () => {
    // Regression: don't accidentally suppress deletes in the common case.
    const result = computeTeamChanges(
      [makeWiki({ teamID: 1, teamName: 'Arsenal' })],
      [
        makeDb({ id: 10, team_id: 1, team_name: 'Arsenal' }),
        makeDb({ id: 20, team_id: 99, team_name: 'Stale Club' }),
      ],
      99,
    );

    expect(result.hadUnresolvedWikiRows).toBe(false);
    expect(result.deletes).toHaveLength(1);
    expect(result.deletes[0].id).toBe(20);
  });

  it('treats a transfer_type mismatch as delete+create (composite key includes transfer_type)', () => {
    // Wiki says loan; DB says permanent. The BE `unique_player_permanent_transfer`
    // constraint forbids in-place transfer_type swap for player+permanent rows,
    // so a "change of type" must be delete+create — composite-key matching gets
    // this right; team_id-keyed matching would have silently mutated the wrong
    // row in the loan-then-permanent case.
    const result = computeTeamChanges(
      [makeWiki({ typeOfTransfer: 'Loan from Real Madrid' })],
      [makeDb({ id: 8, transfer_type: 'permanent' })],
      99,
    );

    expect(result.updates).toEqual([]);
    expect(result.creates).toHaveLength(1);
    expect(result.creates[0].teamData.transfer_type).toBe('loan');
    expect(result.deletes).toHaveLength(1);
    expect(result.deletes[0].id).toBe(8);
  });

  // --- Multi-spell coverage (regression for the loan-then-permanent bug) ---

  it('matches two spells at the same club by composite key (loan then permanent)', () => {
    // Reproduces the original bug: player has Arsenal loan 2010, then Arsenal
    // permanent 2012. Each wiki row must match its OWN DB row by id, not the
    // last-inserted one in a team_id-keyed map.
    const wiki = [
      makeWiki({ teamID: 1, teamName: 'Arsenal', joinYear: 2010, departYear: 2011, appearances: 50, goals: 8, typeOfTransfer: 'Loan' }),
      makeWiki({ teamID: 1, teamName: 'Arsenal', joinYear: 2012, departYear: 2015, appearances: 90, goals: 25, typeOfTransfer: 'Permanent' }),
    ];
    const db = [
      makeDb({ id: 100, team_id: 1, start_year: 2010, end_year: 2011, apps: 50, goals: 8, transfer_type: 'loan' }),
      makeDb({ id: 200, team_id: 1, start_year: 2012, end_year: 2015, apps: 90, goals: 25, transfer_type: 'permanent' }),
    ];

    const result = computeTeamChanges(wiki, db, 99);

    // Both spells already match → no operations of any kind. Pre-fix, the
    // loan wiki row was silently dropped by `Map.set` collision.
    expect(result.updates).toEqual([]);
    expect(result.creates).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  it('attributes a mismatch to the correct spell — loan stats change does NOT touch the permanent row', () => {
    // Most explicit regression test: loan apps drift to 55. The update must
    // target id=100 (loan), not id=200 (permanent). Asserting by id, not count.
    const wiki = [
      makeWiki({ teamID: 1, teamName: 'Arsenal', joinYear: 2010, departYear: 2011, appearances: 55, goals: 8, typeOfTransfer: 'Loan' }),
      makeWiki({ teamID: 1, teamName: 'Arsenal', joinYear: 2012, departYear: 2015, appearances: 90, goals: 25, typeOfTransfer: 'Permanent' }),
    ];
    const db = [
      makeDb({ id: 100, team_id: 1, start_year: 2010, end_year: 2011, apps: 50, goals: 8, transfer_type: 'loan' }),
      makeDb({ id: 200, team_id: 1, start_year: 2012, end_year: 2015, apps: 90, goals: 25, transfer_type: 'permanent' }),
    ];

    const result = computeTeamChanges(wiki, db, 99);

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].id).toBe(100); // ← the loan row, NOT the permanent
    expect(result.updates[0].changes.apps).toBe(55);
    expect(result.updates[0].changes.transfer_type).toBe('loan');
    expect(result.updates[0].changes.start_year).toBe(2010);
  });

  it('handles 3+ spells at the same club (Ronaldo-style Man Utd × 2)', () => {
    const wiki = [
      makeWiki({ teamID: 1, joinYear: 2003, departYear: 2009, appearances: 196, goals: 84, typeOfTransfer: 'Permanent' }),
      makeWiki({ teamID: 2, teamName: 'Real Madrid', joinYear: 2009, departYear: 2018, appearances: 292, goals: 311, typeOfTransfer: 'Permanent' }),
      makeWiki({ teamID: 1, joinYear: 2021, departYear: 2022, appearances: 28, goals: 18, typeOfTransfer: 'Permanent' }),
    ];
    const db = [
      makeDb({ id: 10, team_id: 1, start_year: 2003, end_year: 2009, apps: 196, goals: 84, transfer_type: 'permanent' }),
      makeDb({ id: 11, team_id: 2, team_name: 'Real Madrid', start_year: 2009, end_year: 2018, apps: 292, goals: 311, transfer_type: 'permanent' }),
      makeDb({ id: 12, team_id: 1, start_year: 2021, end_year: 2022, apps: 28, goals: 18, transfer_type: 'permanent' }),
    ];

    const result = computeTeamChanges(wiki, db, 99);

    expect(result.updates).toEqual([]);
    expect(result.creates).toEqual([]);
    expect(result.deletes).toEqual([]);
  });

  it('does NOT emit an update for a row whose DB was just refreshed to match', () => {
    // Simulates the post-inline-sync state: a row that previously had a
    // mismatch now matches because the page refetched dbFootballerTeams.
    const wiki = makeWiki({ appearances: 50, goals: 10 });
    const dbBeforeSync = makeDb({ apps: 42, goals: 8 });
    const dbAfterSync = makeDb({ apps: 50, goals: 10 });

    const before = computeTeamChanges([wiki], [dbBeforeSync], 99);
    const after = computeTeamChanges([wiki], [dbAfterSync], 99);

    expect(before.updates).toHaveLength(1);
    expect(after.updates).toHaveLength(0);
  });
});
