import type { Footballer, FootballerTeam, n8nWikiPlayerData, Team } from '@/types/player';
import { cleanup, render as rtlRender, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SeniorCareerCard } from '@/components/career-lookup/senior-career-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FootballerAPI } from '@/lib/footballer-api';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    createFootballerTeam: vi.fn(),
    updateFootballerTeam: vi.fn(),
  },
}));

// The card uses `<Tooltip>` for the Data Source column header; in real usage
// `career-lookup-info.tsx` wraps the section in a TooltipProvider. Tests
// stand the card up directly, so we wrap here.
function render(ui: React.ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

const mockCreate = vi.mocked(FootballerAPI.createFootballerTeam);
const mockUpdate = vi.mocked(FootballerAPI.updateFootballerTeam);

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

const makeDbTeam = (overrides: Partial<FootballerTeam> = {}): FootballerTeam => ({
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

const makePlayerData = (overrides: Partial<n8nWikiPlayerData> = {}): n8nWikiPlayerData => ({
  playerName: 'Test Player',
  playerFoundInDB: true,
  playerDBId: 99,
  dateOfBirth: '1990-01-01',
  birthCountry: 'England',
  countryFoundInDB: true,
  countryID: 1,
  position: 'FW',
  totalAppearances: 42,
  totalGoals: 15,
  summary: { totalTeams: 1, foundTeams: 1, notFoundTeams: 0 },
  teams: [makeWiki()],
  ...overrides,
});

const makeFootballer = (overrides: Partial<Footballer> = {}): Footballer => ({
  id: 99,
  status: 'APPROVED',
  user: 1,
  first_name: 'Test',
  last_name: 'Player',
  full_name: 'Test Player',
  nation: { id: 1, name: 'England', nationality: 'English', short: 'ENG' },
  other_nations: [],
  date_of_birth: '1990-01-01',
  wikipedia_url: null,
  show_date_of_birth_on_search: true,
  retired: false,
  is_player: true,
  is_manager: false,
  might_change: false,
  available_for_career_path: true,
  available_for_grid: true,
  available_for_scout: true,
  career_path_difficulty: 'NORMAL',
  teams_played_for: [],
  teams_managed: [],
  positions: null,
  pictures: null,
  national_stats: null,
  additional_info: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('SeniorCareerCard — inline per-club sync', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  afterEach(() => cleanup());

  it('shows a Synced badge (no action button) when wiki and DB match by team_id', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData()}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam()] })}
        dbFootballerTeams={[makeDbTeam()]}
        footballerId={99}
      />,
    );

    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Update in DB/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add to DB/i })).not.toBeInTheDocument();
  });

  it('renders an "Update in DB" button when stats differ; click sends the wiki values', async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue(makeDbTeam({ apps: 50 }));
    const onClubStatsUpdated = vi.fn();

    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [makeWiki({ appearances: 50 })] })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam({ apps: 42 })] })}
        dbFootballerTeams={[makeDbTeam({ apps: 42 })]}
        footballerId={99}
        onClubStatsUpdated={onClubStatsUpdated}
      />,
    );

    const updateBtn = screen.getByRole('button', { name: /Update in DB/i });
    await user.click(updateBtn);

    expect(mockUpdate).toHaveBeenCalledWith(1, {
      footballer_id: 99,
      team_id: 12345,
      role: 'player',
      apps: 50,
      goals: 15,
      transfer_type: 'permanent',
      start_year: 2015,
      end_year: 2018,
    });
    expect(onClubStatsUpdated).toHaveBeenCalledTimes(1);
  });

  it('renders an "Add to DB" button when wiki has a team_id absent from DB', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue(makeDbTeam({ team_id: 999, team_name: 'New Club' }));
    const onClubStatsUpdated = vi.fn();

    render(
      <SeniorCareerCard
        playerData={makePlayerData({
          teams: [makeWiki({ teamID: 999, teamName: 'New Club' })],
        })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [] })}
        dbFootballerTeams={[]}
        footballerId={99}
        onClubStatsUpdated={onClubStatsUpdated}
      />,
    );

    const addBtn = screen.getByRole('button', { name: /Add to DB/i });
    await user.click(addBtn);

    expect(mockCreate).toHaveBeenCalledWith({
      footballer_id: 99,
      team_id: 999,
      role: 'player',
      apps: 42,
      goals: 15,
      transfer_type: 'permanent',
      start_year: 2015,
      end_year: 2018,
    });
    expect(onClubStatsUpdated).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error message when the per-row sync fails', async () => {
    const user = userEvent.setup();
    mockUpdate.mockRejectedValue(new Error('Network down'));

    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [makeWiki({ appearances: 50 })] })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam({ apps: 42 })] })}
        dbFootballerTeams={[makeDbTeam({ apps: 42 })]}
        footballerId={99}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Update in DB/i }));

    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders the 💡 affordance copy when footballerId is set', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData()}
        dbPlayerInfo={makeFootballer()}
        dbFootballerTeams={[]}
        footballerId={99}
      />,
    );

    expect(screen.getByText(/You can sync club stats here directly/i)).toBeInTheDocument();
  });

  it('renders the 📋 deploy copy when footballerId is null (new player)', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData({ playerFoundInDB: false, playerDBId: null })}
        dbPlayerInfo={null}
        footballerId={null}
      />,
    );

    expect(screen.getByText(/Club stats will be created automatically when you deploy/i)).toBeInTheDocument();
  });

  it('does not render Sync All when no rows are actionable', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData()}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam()] })}
        dbFootballerTeams={[makeDbTeam()]}
        footballerId={99}
      />,
    );

    expect(screen.queryByRole('button', { name: /Sync All/i })).not.toBeInTheDocument();
  });

  it('renders Sync All (N) with the pending row count', () => {
    const teams = [
      makeWiki({ teamID: 1, teamName: 'A', appearances: 99 }),
      makeWiki({ teamID: 2, teamName: 'B', appearances: 99 }),
      makeWiki({ teamID: 3, teamName: 'C' }),
    ];
    const dbTeams = [
      makeDbTeam({ id: 11, team_id: 1, apps: 42 }), // mismatch
      // team_id: 2 absent → not-in-db
      makeDbTeam({ id: 33, team_id: 3, apps: 42, goals: 15, start_year: 2015, end_year: 2018, transfer_type: 'permanent' }), // synced
    ];

    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams })}
        dbPlayerInfo={makeFootballer({ teams_played_for: dbTeams })}
        dbFootballerTeams={dbTeams}
        footballerId={99}
      />,
    );

    // 2 actionable (mismatch + not-in-db); the 3rd is already synced.
    expect(screen.getByRole('button', { name: /Sync All \(2\)/i })).toBeInTheDocument();
  });

  it('does NOT render sync buttons when footballerId is null', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [makeWiki({ appearances: 50 })] })}
        dbPlayerInfo={null}
        dbFootballerTeams={[]}
        footballerId={null}
      />,
    );

    // No "Update in DB" / "Add to DB" buttons without a footballerId.
    expect(screen.queryByRole('button', { name: /Update in DB/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add to DB/i })).not.toBeInTheDocument();
  });

  it('keeps the Edit Team admin link visible alongside the sync button', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [makeWiki({ appearances: 50 })] })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam({ apps: 42 })] })}
        dbFootballerTeams={[makeDbTeam({ apps: 42 })]}
        footballerId={99}
      />,
    );

    // Both the sync button and the legacy admin link are present.
    expect(screen.getByRole('button', { name: /Update in DB/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit Team/i })).toBeInTheDocument();
  });
});

describe('SeniorCareerCard — falls back to dbPlayerInfo.teams_played_for when prop omitted', () => {
  afterEach(() => cleanup());

  it('treats the embedded teams_played_for as the comparison source', () => {
    // dbFootballerTeams intentionally omitted; comparison should use the
    // snapshot from dbPlayerInfo.teams_played_for.
    render(
      <SeniorCareerCard
        playerData={makePlayerData()}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam()] })}
        footballerId={99}
      />,
    );

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });
});

describe('SeniorCareerCard — within row layout', () => {
  afterEach(() => cleanup());

  it('renders sync button and admin link inside the same Actions cell', () => {
    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [makeWiki({ appearances: 50 })] })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [makeDbTeam({ apps: 42 })] })}
        dbFootballerTeams={[makeDbTeam({ apps: 42 })]}
        footballerId={99}
      />,
    );
    // Both controls are in the body row's last cell. We don't pin by index;
    // just confirm they coexist as siblings inside a flex column container.
    const updateBtn = screen.getByRole('button', { name: /Update in DB/i });
    const adminLink = screen.getByRole('link', { name: /Edit Team/i });
    const sharedAncestor = updateBtn.closest('td');

    expect(sharedAncestor).not.toBeNull();
    expect(within(sharedAncestor as HTMLElement).getByRole('link', { name: /Edit Team/i })).toBe(adminLink);
  });
});

// Regression: a player with two spells at the same club (loan then permanent)
// must produce per-row sync state and target the correct DB row id. Pre-fix,
// keying the `dbByTeamId` map + `useRowSync` state by `team.teamID` alone
// collapsed both spells under one entry — the loan-row button mutated the
// permanent record's id and both rows shared loading/spinner state.
describe('SeniorCareerCard — multi-spell at same club', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  afterEach(() => cleanup());

  const arsenalLoan = makeWiki({
    teamName: 'Arsenal',
    teamID: 1,
    joinYear: 2010,
    departYear: 2011,
    appearances: 20,
    goals: 3,
    typeOfTransfer: 'Loan',
  });
  const arsenalPermanent = makeWiki({
    teamName: 'Arsenal',
    teamID: 1,
    joinYear: 2012,
    departYear: 2015,
    appearances: 90,
    goals: 25,
    typeOfTransfer: 'Permanent',
  });
  const dbLoan = makeDbTeam({
    id: 100,
    team_id: 1,
    team_name: 'Arsenal',
    start_year: 2010,
    end_year: 2011,
    apps: 18, // ← mismatch on apps so the loan row shows "Update in DB"
    goals: 3,
    transfer_type: 'loan',
  });
  const dbPermanent = makeDbTeam({
    id: 200,
    team_id: 1,
    team_name: 'Arsenal',
    start_year: 2012,
    end_year: 2015,
    apps: 90,
    goals: 25,
    transfer_type: 'permanent',
  });

  it('clicking "Update in DB" on the LOAN row calls updateFootballerTeam with the LOAN row id (not the permanent)', async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue({ ...dbLoan, apps: 20 });

    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [arsenalLoan, arsenalPermanent] })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [dbLoan, dbPermanent] })}
        dbFootballerTeams={[dbLoan, dbPermanent]}
        footballerId={99}
      />,
    );

    // Exactly one update button (only the loan row mismatches; permanent matches).
    const updateButtons = screen.getAllByRole('button', { name: /Update in DB/i });

    expect(updateButtons).toHaveLength(1);

    await user.click(updateButtons[0]);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      100, // ← LOAN row's id, NOT 200 (the permanent's)
      expect.objectContaining({
        apps: 20,
        transfer_type: 'loan',
        start_year: 2010,
      }),
    );
  });

  it('two mismatched spells at the same club render TWO independent Update buttons (sync state is per-spell)', async () => {
    const user = userEvent.setup();
    // Both rows mismatch — drift apps on both.
    const dbLoanDrift = makeDbTeam({ ...dbLoan, apps: 18 });
    const dbPermDrift = makeDbTeam({ ...dbPermanent, apps: 85 });
    // First click resolves; second never resolves, so we can observe state independence.
    mockUpdate.mockResolvedValueOnce(dbLoanDrift)
      .mockImplementationOnce(() => new Promise(() => { /* pending forever */ }));

    render(
      <SeniorCareerCard
        playerData={makePlayerData({ teams: [arsenalLoan, arsenalPermanent] })}
        dbPlayerInfo={makeFootballer({ teams_played_for: [dbLoanDrift, dbPermDrift] })}
        dbFootballerTeams={[dbLoanDrift, dbPermDrift]}
        footballerId={99}
      />,
    );

    const updateButtons = screen.getAllByRole('button', { name: /Update in DB/i });

    expect(updateButtons).toHaveLength(2);

    // Click only the loan-row button. The permanent-row button must remain
    // clickable — pre-fix, both shared the same sync key and both flipped to
    // "Processing..." simultaneously.
    await user.click(updateButtons[0]);

    expect(mockUpdate).toHaveBeenCalledWith(100, expect.anything());
    // The other row's button must still be present (not turned into a Processing badge).
    expect(screen.getAllByRole('button', { name: /Update in DB/i })).toHaveLength(1);
  });
});
