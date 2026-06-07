import type { CreateFootballerTeamRequest, FootballerTeam, Team } from '@/types/player';

export type TeamUpdate = {
  id: number;
  changes: Partial<CreateFootballerTeamRequest>;
  teamName: string;
  /** 1-indexed display position from the Wikipedia ordering. */
  position: number;
};

export type TeamCreate = {
  teamData: CreateFootballerTeamRequest;
  teamName: string;
  /** 1-indexed display position from the Wikipedia ordering. */
  position: number;
};

export type TeamDelete = {
  id: number;
  teamName: string;
  /** 1-indexed display position from the existing DB ordering. */
  position: number;
};

export type TeamChanges = {
  updates: TeamUpdate[];
  creates: TeamCreate[];
  deletes: TeamDelete[];
};

/**
 * Derive `transfer_type` from the wiki's free-text `typeOfTransfer` field.
 * Matches the contains-"loan" heuristic used everywhere we round-trip wiki
 * data through the BE serializer.
 */
export function inferTransferType(typeOfTransfer: string | undefined): 'permanent' | 'loan' {
  return (typeOfTransfer || '').toLowerCase().includes('loan') ? 'loan' : 'permanent';
}

/**
 * Composite row key for matching a wiki spell to its DB row. Keying by
 * `team_id` alone collides when a player has multiple spells at the same
 * club (loan then permanent, two loans, player-then-manager). The BE
 * model allows all of those: `unique_player_permanent_transfer` is the
 * ONLY uniqueness constraint, and it's filtered to `role='player' AND
 * transfer_type='permanent'` over `(footballer, team, start_year,
 * transfer_type)`. So `(team_id, start_year, transfer_type, role)` is the
 * tightest key that won't collide for any state the DB accepts.
 *
 * Edge cases:
 * - `start_year` null/undefined → sentinel `'NULL'`. Two rows that both
 *   have a null start_year will collide; that's intentional (legacy data
 *   without a start_year is one undifferentiable bucket — fix the data
 *   in admin, not here).
 * - `transfer_type` always passed explicitly so callers can't drift from
 *   `inferTransferType`'s wiki→DB normalization.
 */
export function teamRowKey(
  teamId: number,
  startYear: number | null | undefined,
  transferType: 'permanent' | 'loan',
  role: 'player' | 'manager' = 'player',
): string {
  return `${teamId}|${startYear ?? 'NULL'}|${transferType}|${role}`;
}

/** Composite key for a wiki spell. Returns `null` for unresolvable rows. */
export function wikiTeamRowKey(team: Team): string | null {
  if (!team.teamFound || team.teamID == null) {
    return null;
  }
  return teamRowKey(team.teamID, team.joinYear, inferTransferType(team.typeOfTransfer));
}

/** Composite key for a DB row. */
export function dbTeamRowKey(team: FootballerTeam): string {
  return teamRowKey(team.team_id, team.start_year, team.transfer_type, team.role);
}

/**
 * Compute the delete/update/create deltas to reconcile a footballer's DB
 * `teams_played_for` rows with the Wikipedia-derived `Team[]` from n8n.
 *
 * Matching is by composite `(team_id, start_year, transfer_type, role)` key
 * — see `teamRowKey`. Matching by `team_id` alone (the pre-fix approach)
 * collided when a player had multiple spells at the same club, silently
 * dropping one spell from every collision pair. Matching by array position
 * (the pre-PR approach) drifted as soon as a single row was synced inline.
 * Composite-key matching handles both.
 *
 * - `updates`: same composite key in both, but at least one tracked field
 *   differs. `team_id`, `role`, `start_year`, `end_year` are always echoed
 *   back to the BE — DRF treats them as required on PUT (omitting causes a
 *   400 or null-overwrites).
 * - `creates`: wiki spell whose composite key has no DB match.
 * - `deletes`: DB spell whose composite key has no wiki match.
 *
 * Wiki rows without a `teamID` (n8n couldn't resolve the club) are
 * skipped — the deploy console surfaces those separately so the user can
 * fix them by hand.
 */
export function computeTeamChanges(
  wikiTeams: Team[],
  dbTeams: FootballerTeam[],
  footballerId: number,
): TeamChanges {
  const wikiByKey = new Map<string, { team: Team; position: number }>();
  wikiTeams.forEach((team, idx) => {
    const key = wikiTeamRowKey(team);
    if (key !== null) {
      wikiByKey.set(key, { team, position: idx + 1 });
    }
  });

  const dbByKey = new Map<string, { team: FootballerTeam; position: number }>();
  dbTeams.forEach((team, idx) => {
    dbByKey.set(dbTeamRowKey(team), { team, position: idx + 1 });
  });

  const updates: TeamUpdate[] = [];
  const creates: TeamCreate[] = [];
  const deletes: TeamDelete[] = [];

  for (const [key, { team: wikiTeam, position }] of wikiByKey) {
    const dbEntry = dbByKey.get(key);
    if (!dbEntry) {
      creates.push({
        teamData: {
          footballer_id: footballerId,
          team_id: wikiTeam.teamID!,
          role: 'player',
          apps: wikiTeam.appearances,
          goals: wikiTeam.goals,
          transfer_type: inferTransferType(wikiTeam.typeOfTransfer),
          start_year: wikiTeam.joinYear,
          end_year: wikiTeam.departYear,
        },
        teamName: wikiTeam.teamName,
        position,
      });
      continue;
    }

    const dbTeam = dbEntry.team;
    // Composite key already guarantees transfer_type, start_year, and role
    // match — the only fields that can still differ are apps, goals, and
    // end_year. Diff those, then echo back the load-bearing fields so the
    // DRF serializer accepts the PUT.
    const changes: Partial<CreateFootballerTeamRequest> = {};
    if (dbTeam.apps !== wikiTeam.appearances) {
      changes.apps = wikiTeam.appearances;
    }
    if (dbTeam.goals !== wikiTeam.goals) {
      changes.goals = wikiTeam.goals;
    }
    if (dbTeam.end_year !== wikiTeam.departYear) {
      changes.end_year = wikiTeam.departYear;
    }

    if (Object.keys(changes).length === 0) {
      continue;
    }

    changes.team_id = dbTeam.team_id;
    changes.role = dbTeam.role;
    changes.transfer_type = dbTeam.transfer_type;
    changes.start_year = dbTeam.start_year ?? undefined;
    if (!Object.hasOwn(changes, 'end_year')) {
      changes.end_year = dbTeam.end_year;
    }

    updates.push({
      id: dbTeam.id,
      changes,
      teamName: wikiTeam.teamName,
      position,
    });
  }

  for (const [key, { team: dbTeam, position }] of dbByKey) {
    if (!wikiByKey.has(key)) {
      deletes.push({
        id: dbTeam.id,
        teamName: dbTeam.team_name,
        position,
      });
    }
  }

  return { updates, creates, deletes };
}
