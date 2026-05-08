import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/team-api', () => ({
  TeamAPI: { searchTeams: vi.fn() },
}));

import { TeamCombobox } from '@/components/footballer-management/TeamCombobox';
import { TeamAPI } from '@/lib/team-api';

const mockSearch = vi.mocked(TeamAPI.searchTeams);

describe('TeamCombobox', () => {
  beforeEach(() => mockSearch.mockReset());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the placeholder when nothing is selected', () => {
    render(<TeamCombobox value={null} onChange={vi.fn()} placeholder="Search a team…" />);
    expect(screen.getByText('Search a team…')).toBeInTheDocument();
  });

  it('does not query the API for fewer than 2 characters', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue([]);
    render(<TeamCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText(/at least 2/), 'a');
    // Wait long enough for the 250ms debounce.
    await new Promise((r) => setTimeout(r, 320));
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('renders search results from the API', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue([
      { id: 1, name: 'AC Milan' },
      { id: 2, name: 'Inter Milan' },
    ]);
    render(<TeamCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText(/at least 2/), 'mil');

    expect(await screen.findByText('AC Milan')).toBeInTheDocument();
    expect(screen.getByText('Inter Milan')).toBeInTheDocument();
    expect(mockSearch).toHaveBeenCalledWith('mil');
  });

  it('clicking a row fires onChange with id + name', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockSearch.mockResolvedValue([{ id: 7, name: 'AC Milan' }]);
    render(<TeamCombobox value={null} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText(/at least 2/), 'milan');
    await user.click(await screen.findByText('AC Milan'));

    expect(onChange).toHaveBeenCalledWith({ id: 7, name: 'AC Milan' });
  });

  it('shows the selected team name in the trigger when value is set', async () => {
    render(<TeamCombobox value={{ id: 7, name: 'AC Milan' }} onChange={vi.fn()} />);
    expect(screen.getByText('AC Milan')).toBeInTheDocument();
  });

  it('shows an empty-result message when nothing matches', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue([]);
    render(<TeamCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText(/at least 2/), 'zzz');

    await waitFor(() =>
      expect(screen.getByText(/No teams match/)).toBeInTheDocument(),
    );
  });
});
