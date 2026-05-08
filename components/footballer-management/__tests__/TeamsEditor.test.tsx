import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    getFootballerTeams: vi.fn(),
    createFootballerTeam: vi.fn(),
    patchFootballerTeam: vi.fn(),
    deleteFootballerTeam: vi.fn(),
  },
}));
vi.mock('@/lib/team-api', () => ({
  TeamAPI: { searchTeams: vi.fn() },
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { TeamsEditor } from '@/components/footballer-management/sub-editors/TeamsEditor';
import { FootballerAPI } from '@/lib/footballer-api';
import { TeamAPI } from '@/lib/team-api';
import { toast } from 'sonner';

const api = vi.mocked(FootballerAPI);
const mockTeamSearch = vi.mocked(TeamAPI.searchTeams);
const mockToast = vi.mocked(toast);

function teamRow(over = {}) {
  return {
    id: 1,
    footballer_id: 42,
    footballer_name: 'Cristiano Ronaldo',
    team_id: 7,
    team_name: 'AC Milan',
    role: 'player' as const,
    apps: 196,
    goals: 84,
    transfer_type: 'permanent' as const,
    start_year: 2003,
    end_year: 2009,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...over,
  };
}

describe('TeamsEditor', () => {
  beforeEach(() => {
    api.getFootballerTeams.mockReset();
    api.createFootballerTeam.mockReset();
    api.patchFootballerTeam.mockReset();
    api.deleteFootballerTeam.mockReset();
    mockTeamSearch.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the empty-state when no stints exist', async () => {
    api.getFootballerTeams.mockResolvedValueOnce([]);
    render(<TeamsEditor footballerId={42} />);
    expect(await screen.findByText(/No team stints yet/)).toBeInTheDocument();
  });

  it('renders existing stints in a table', async () => {
    api.getFootballerTeams.mockResolvedValueOnce([
      teamRow({ id: 1, team_name: 'AC Milan' }),
      teamRow({ id: 2, team_name: 'Manchester United', start_year: 2009, end_year: 2018 }),
    ]);
    render(<TeamsEditor footballerId={42} />);

    expect(await screen.findByText('AC Milan')).toBeInTheDocument();
    expect(screen.getByText('Manchester United')).toBeInTheDocument();
  });

  it('Add stint flow validates the team is picked before saving', async () => {
    const user = userEvent.setup();
    api.getFootballerTeams.mockResolvedValueOnce([]);
    render(<TeamsEditor footballerId={42} />);
    await screen.findByText(/No team stints yet/);

    await user.click(screen.getByRole('button', { name: /Add stint/ }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(api.createFootballerTeam).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith('Pick a team.');
  });

  it('Add stint flow POSTs the FootballerTeam payload on save', async () => {
    const user = userEvent.setup();
    api.getFootballerTeams.mockResolvedValueOnce([]);
    api.createFootballerTeam.mockResolvedValueOnce(teamRow({ id: 99, team_name: 'AC Milan' }));
    api.getFootballerTeams.mockResolvedValueOnce([teamRow({ id: 99, team_name: 'AC Milan' })]);
    mockTeamSearch.mockResolvedValue([{ id: 7, name: 'AC Milan' }]);

    render(<TeamsEditor footballerId={42} />);
    await screen.findByText(/No team stints yet/);
    await user.click(screen.getByRole('button', { name: /Add stint/ }));

    // Pick a team via the inline TeamCombobox. There are several
    // ``combobox`` roles in the row (Role, Transfer) — use the
    // distinguishing placeholder text to grab the right one.
    await user.click(screen.getByText('Search a team…'));
    await user.type(screen.getByPlaceholderText(/at least 2/), 'milan');
    await user.click(await screen.findByText('AC Milan'));

    // Type some apps + goals.
    await user.type(screen.getByLabelText('Apps'), '50');
    await user.type(screen.getByLabelText('Goals'), '20');
    await user.type(screen.getByLabelText('Start year'), '2020');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(api.createFootballerTeam).toHaveBeenCalledTimes(1));
    expect(api.createFootballerTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        footballer_id: 42,
        team_id: 7,
        role: 'player',
        apps: 50,
        goals: 20,
        start_year: 2020,
        transfer_type: 'permanent',
      }),
    );
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('Delete confirms then calls the API and re-fetches', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.getFootballerTeams.mockResolvedValueOnce([teamRow({ id: 1, team_name: 'AC Milan' })]);
    api.deleteFootballerTeam.mockResolvedValueOnce(undefined as never);
    api.getFootballerTeams.mockResolvedValueOnce([]);

    render(<TeamsEditor footballerId={42} />);
    const row = await screen.findByRole('row', { name: /AC Milan/ });
    await user.click(within(row).getByLabelText('Delete AC Milan'));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(api.deleteFootballerTeam).toHaveBeenCalledWith(1));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('Delete bails out when the user cancels the confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    api.getFootballerTeams.mockResolvedValueOnce([teamRow({ id: 1, team_name: 'AC Milan' })]);

    render(<TeamsEditor footballerId={42} />);
    const row = await screen.findByRole('row', { name: /AC Milan/ });
    await user.click(within(row).getByLabelText('Delete AC Milan'));

    expect(api.deleteFootballerTeam).not.toHaveBeenCalled();
  });
});
