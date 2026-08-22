import type { PaginatedPlayers, RosterParams } from '@/types/team';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RosterBrowser } from '@/components/roster/RosterBrowser';

// Stood in for, because this test is about what the browser DOES with a chosen
// nationality, not about the combobox's own fetching.
vi.mock('@/components/footballer-management/NationCombobox', () => ({
  NationCombobox: ({ onChange }: { onChange: (id: number | null) => void }) => (
    <button type="button" onClick={() => onChange(76)}>Pick Brazil</button>
  ),
}));

function page(over: Partial<PaginatedPlayers> = {}): PaginatedPlayers {
  return {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        footballer_id: 9,
        full_name: 'Willian Borges',
        nation_name: 'Brazil',
        nation_short: 'BRA',
        role: 'player',
        transfer_type: 'permanent',
        start_year: 2013,
        end_year: 2020,
        apps: 234,
        goals: 37,
        retired: false,
      },
    ],
    ...over,
  } as unknown as PaginatedPlayers;
}

function renderBrowser(
  over: Partial<Parameters<typeof RosterBrowser>[0]> = {},
  payload: PaginatedPlayers = page(),
) {
  const fetchPage = vi.fn<(id: number, params: RosterParams) => Promise<PaginatedPlayers>>(
    async () => payload,
  );
  render(<RosterBrowser subjectId={7} fetchPage={fetchPage} {...over} />);
  return { fetchPage };
}

describe('rosterBrowser', () => {
  it('asks for the subject it was given', async () => {
    const { fetchPage } = renderBrowser();

    await waitFor(() => expect(fetchPage).toHaveBeenCalled());

    expect(fetchPage.mock.calls[0][0]).toBe(7);
  });

  it('renders nothing at all until a subject is chosen', () => {
    // Not an empty table: an empty roster and no roster look identical, and
    // only one of them means "pick something".
    const { fetchPage } = renderBrowser({ subjectId: null });

    expect(fetchPage).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Table view')).not.toBeInTheDocument();
  });

  it('offers the nationality filter, which is what makes "Brazilians in England" askable', async () => {
    // It was in the API from the start and exposed nowhere. Putting it in the
    // shared browser gives it to the squad page and the country page at once.
    const { fetchPage } = renderBrowser({ nationFilterLabel: 'Nationality (of the footballer)' });

    await waitFor(() => expect(fetchPage).toHaveBeenCalled());

    expect(screen.getByText('Nationality (of the footballer)')).toBeInTheDocument();
  });

  it('sends the chosen nationality to the server, not to a client-side filter', async () => {
    // Filtering the fetched page would filter fifty rows out of eight thousand.
    const { fetchPage } = renderBrowser();

    await waitFor(() => expect(fetchPage).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Pick Brazil' }));

    await waitFor(() => {
      expect(fetchPage.mock.calls.at(-1)![1].nation_id).toBe(76);
    });
  });

  it('goes back to page one when a filter changes', async () => {
    // Page 3 of a four-row filter does not exist, and the backend answers it
    // with an empty list that reads as "nobody matches".
    const { fetchPage } = renderBrowser({}, page({ count: 120 }));

    await waitFor(() => expect(fetchPage).toHaveBeenCalled());

    // The paginator's page links carry no href, so they have no link role.
    fireEvent.click(screen.getByText('3'));
    await waitFor(() => expect(fetchPage.mock.calls.at(-1)![1].page).toBe(3));

    fireEvent.click(screen.getByRole('button', { name: 'Pick Brazil' }));

    await waitFor(() => {
      const last = fetchPage.mock.calls.at(-1)![1];

      expect(last.nation_id).toBe(76);
      expect(last.page).toBe(1);
    });
  });

  it('passes every filter to the caller rather than filtering in the browser', async () => {
    // Filtering the fetched page would filter fifty rows out of eight thousand.
    const { fetchPage } = renderBrowser();

    await waitFor(() => expect(fetchPage).toHaveBeenCalled());
    const params = fetchPage.mock.calls[0][1];

    expect(params).toMatchObject({ role: 'player', ordering: '-start_year', page: 1, page_size: 50 });
  });

  it('shows the header the page supplied', async () => {
    renderBrowser({ header: <p>Everyone who played in England</p> });

    expect(screen.getByText('Everyone who played in England')).toBeInTheDocument();
  });
});
