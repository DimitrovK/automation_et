import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/team-api', () => ({
  TeamAPI: { searchTeams: vi.fn() },
}));

import { TeamAPI } from '@/lib/team-api';
import { TeamSearch } from '@/components/team-players/TeamSearch';

const mockSearch = vi.mocked(TeamAPI.searchTeams);

const teams = [
  { id: 1, name: 'AC Milan' },
  { id: 2, name: 'Inter Milan' },
  { id: 3, name: 'Ajax' },
];

describe('TeamSearch', () => {
  beforeEach(() => {
    mockSearch.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ---- name autocomplete ------------------------------------------------

  it('debounces and renders search results in the dropdown', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(teams);
    render(<TeamSearch onSelect={vi.fn()} />);

    await user.type(screen.getByLabelText('Search team by name'), 'Mil');

    // The component debounces (250ms) — `findBy*` polls until the row appears.
    expect(await screen.findByRole('option', { name: /AC Milan/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Inter Milan/ })).toBeInTheDocument();
    expect(mockSearch).toHaveBeenCalledWith('Mil');
  });

  it('does not query for fewer than 2 characters', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue([]);
    render(<TeamSearch onSelect={vi.fn()} />);

    await user.type(screen.getByLabelText('Search team by name'), 'a');

    // Wait long enough that any debounce would have fired.
    await new Promise((r) => setTimeout(r, 350));
    expect(mockSearch).not.toHaveBeenCalled();
  });

  // ---- keyboard navigation ---------------------------------------------

  it('moves the highlight with ArrowDown / ArrowUp and wraps around', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(teams);
    render(<TeamSearch onSelect={vi.fn()} />);

    const input = screen.getByLabelText('Search team by name');
    await user.type(input, 'milan');
    await screen.findByRole('option', { name: /AC Milan/ });

    // The initial-highlight effect runs *after* the row mounts, so we
    // ``waitFor`` the aria-selected flip — direct assertion races
    // under load.
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /AC Milan/ })).toHaveAttribute(
        'aria-selected', 'true',
      ),
    );

    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Inter Milan/ })).toHaveAttribute(
        'aria-selected', 'true',
      ),
    );

    await user.keyboard('{ArrowDown}{ArrowDown}'); // past the end → wraps to top
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /AC Milan/ })).toHaveAttribute(
        'aria-selected', 'true',
      ),
    );

    await user.keyboard('{ArrowUp}'); // wraps to bottom
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Ajax/ })).toHaveAttribute(
        'aria-selected', 'true',
      ),
    );
  });

  it('selects the highlighted row on Enter and clears the input', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockSearch.mockResolvedValue(teams);
    render(<TeamSearch onSelect={onSelect} />);

    const input = screen.getByLabelText('Search team by name');
    await user.type(input, 'Mil');
    await screen.findByRole('option', { name: /AC Milan/ });

    await user.keyboard('{ArrowDown}'); // highlight Inter Milan
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(2);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('Enter without arrow keys picks the first (default-highlighted) row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockSearch.mockResolvedValue(teams);
    render(<TeamSearch onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Search team by name'), 'milan');
    await screen.findByRole('option', { name: /AC Milan/ });

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('Escape closes the dropdown', async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(teams);
    render(<TeamSearch onSelect={vi.fn()} />);

    await user.type(screen.getByLabelText('Search team by name'), 'milan');
    await screen.findByRole('option', { name: /AC Milan/ });

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('option', { name: /AC Milan/ })).not.toBeInTheDocument(),
    );
  });

  it('clicking a row picks it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockSearch.mockResolvedValue(teams);
    render(<TeamSearch onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Search team by name'), 'aj');
    const row = await screen.findByRole('option', { name: /Ajax/ });

    await user.click(row);
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  // ---- by-ID tab --------------------------------------------------------

  it('submits a valid ID via the Load button', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TeamSearch onSelect={onSelect} />);

    await user.click(screen.getByRole('tab', { name: /By ID/ }));
    const idInput = screen.getByLabelText('Team ID');
    await user.type(idInput, '42');
    await user.click(screen.getByRole('button', { name: /Load/ }));

    expect(onSelect).toHaveBeenCalledWith(42);
  });

  it('Enter in the ID field submits', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TeamSearch onSelect={onSelect} />);

    await user.click(screen.getByRole('tab', { name: /By ID/ }));
    await user.type(screen.getByLabelText('Team ID'), '7{Enter}');

    expect(onSelect).toHaveBeenCalledWith(7);
  });

  it('reports validation error for non-positive integer IDs', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onValidationError = vi.fn();
    render(<TeamSearch onSelect={onSelect} onValidationError={onValidationError} />);

    await user.click(screen.getByRole('tab', { name: /By ID/ }));
    await user.type(screen.getByLabelText('Team ID'), '0');
    await user.click(screen.getByRole('button', { name: /Load/ }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onValidationError).toHaveBeenCalledWith(
      expect.stringContaining('positive integer'),
    );
  });
});
