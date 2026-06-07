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

  it('preserves role from the existing DB row on update', () => {
    const result = computeTeamChanges(
      [makeWiki({ appearances: 10 })],
      [makeDb({ role: 'manager', apps: 5 })],
      99,
    );

    expect(result.updates[0].changes.role).toBe('manager');
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

  it('infers transfer_type from "loan" substring (case-insensitive)', () => {
    const result = computeTeamChanges(
      [makeWiki({ typeOfTransfer: 'Loan from Real Madrid' })],
      [makeDb({ transfer_type: 'permanent' })],
      99,
    );

    expect(result.updates[0].changes.transfer_type).toBe('loan');
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
