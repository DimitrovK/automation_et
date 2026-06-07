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

function inferTransferType(typeOfTransfer: string | undefined): 'permanent' | 'loan' {
  return (typeOfTransfer || '').toLowerCase().includes('loan') ? 'loan' : 'permanent';
}

/**
 * Compute the delete/update/create deltas to reconcile a footballer's DB
 * `teams_played_for` rows with the Wikipedia-derived `Team[]` from n8n.
 *
 * Matching is by `team_id` (NOT array position). Position-based matching
 * breaks the moment a single row is synced inline — the indices in Wiki
 * and DB stop lining up, and `updates` would spam redundant fixes (or
 * worse, delete-and-recreate the row we just synced). Keying by `team_id`
 * makes already-synced rows fall out naturally: their fields match, so
 * `updates` is empty for them. Mirrors how `getNationChanges` works for
 * international career.
 *
 * - `updates`: same team_id in both, but at least one tracked field differs.
 *   `team_id` and `role` are always echoed back (the DRF serializer treats
 *   them as required on PUT; omitting causes a 400). `start_year` /
 *   `end_year` are echoed too — leaving them out can null-overwrite the row.
 * - `creates`: team_id present in Wiki, absent in DB.
 * - `deletes`: team_id present in DB, absent in Wiki.
 *
 * Wiki teams without a `teamID` (n8n couldn't resolve the club) are
 * skipped — the deploy console surfaces those separately so the user can
 * fix them by hand.
 */
export function computeTeamChanges(
  wikiTeams: Team[],
  dbTeams: FootballerTeam[],
  footballerId: number,
): TeamChanges {
  const wikiByTeamId = new Map<number, { team: Team; position: number }>();
  wikiTeams.forEach((team, idx) => {
    if (team.teamFound && team.teamID != null) {
      wikiByTeamId.set(team.teamID, { team, position: idx + 1 });
    }
  });

  const dbByTeamId = new Map<number, { team: FootballerTeam; position: number }>();
  dbTeams.forEach((team, idx) => {
    dbByTeamId.set(team.team_id, { team, position: idx + 1 });
  });

  const updates: TeamUpdate[] = [];
  const creates: TeamCreate[] = [];
  const deletes: TeamDelete[] = [];

  for (const [teamId, { team: wikiTeam, position }] of wikiByTeamId) {
    const dbEntry = dbByTeamId.get(teamId);
    if (!dbEntry) {
      creates.push({
        teamData: {
          footballer_id: footballerId,
          team_id: teamId,
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
    const transferType = inferTransferType(wikiTeam.typeOfTransfer);
    const changes: Partial<CreateFootballerTeamRequest> = {};

    if (dbTeam.apps !== wikiTeam.appearances) {
      changes.apps = wikiTeam.appearances;
    }
    if (dbTeam.goals !== wikiTeam.goals) {
      changes.goals = wikiTeam.goals;
    }
    if (dbTeam.transfer_type !== transferType) {
      changes.transfer_type = transferType;
    }
    if (dbTeam.start_year !== wikiTeam.joinYear) {
      changes.start_year = wikiTeam.joinYear;
    }
    if (dbTeam.end_year !== wikiTeam.departYear) {
      changes.end_year = wikiTeam.departYear;
    }

    if (Object.keys(changes).length === 0) {
      continue;
    }

    // DRF serializer requires team_id + role on PUT; start/end_year are
    // echoed back to prevent null-overwrites on partial diffs (see #2 in
    // the PR description for the underlying constraint).
    changes.team_id = dbTeam.team_id;
    changes.role = dbTeam.role;
    if (!Object.hasOwn(changes, 'start_year')) {
      changes.start_year = dbTeam.start_year ?? undefined;
    }
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

  for (const [teamId, { team: dbTeam, position }] of dbByTeamId) {
    if (!wikiByTeamId.has(teamId)) {
      deletes.push({
        id: dbTeam.id,
        teamName: dbTeam.team_name,
        position,
      });
    }
  }

  return { updates, creates, deletes };
}
