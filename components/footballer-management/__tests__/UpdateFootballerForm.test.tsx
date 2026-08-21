import type { CreateFootballerRequest, Footballer } from '@/types/player';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UpdateFootballer } from '@/components/footballer-management/update-footballer';

const form: CreateFootballerRequest = {
  status: 'APPROVED',
  user: 1,
  first_name: 'Salvatore',
  last_name: 'Sirigu',
  nation_id: 3,
  date_of_birth: '1987-01-12',
  wikipedia_url: null,
  show_date_of_birth_on_search: true,
  retired: true,
  is_player: true,
  is_manager: false,
  might_change: false,
  available_for_career_path: true,
  available_for_grid: false,
  available_for_scout: true,
  career_path_difficulty: 'NORMAL',
  other_nation_ids: [],
  additional_info: null,
};

const loaded = { id: 7, first_name: 'Salvatore', last_name: 'Sirigu' } as Footballer;

function renderForm(over: Partial<Parameters<typeof UpdateFootballer>[0]> = {}) {
  const onUpdateFootballer = vi.fn();
  render(
    <UpdateFootballer
      updateForm={form}
      updateLoading={false}
      nations={[]}
      nationsLoading={false}
      footballerToUpdate={loaded}
      fetchLoading={false}
      footballerId="7"
      onUpdateFootballer={onUpdateFootballer}
      onFootballerIdChange={vi.fn()}
      onFetchFootballerForUpdate={vi.fn()}
      {...over}
    />,
  );
  return { onUpdateFootballer };
}

describe('updateFootballer', () => {
  it('submits the values it holds, rather than the page holding them', async () => {
    const { onUpdateFootballer } = renderForm();

    fireEvent.change(screen.getByLabelText('Last name *'), { target: { value: 'Buffon' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Footballer/ }));

    await waitFor(() => expect(onUpdateFootballer).toHaveBeenCalled());

    expect(onUpdateFootballer.mock.calls[0][0]).toMatchObject({ last_name: 'Buffon' });
  });

  it('reports a missing last name on the field, not as a banner above the form', async () => {
    // The old form validated in the page's submit handler and rendered "Last
    // name is required" as a page-level alert — it named no field, focused
    // nothing, and sat above the input it was about.
    const { onUpdateFootballer } = renderForm();

    fireEvent.change(screen.getByLabelText('Last name *'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Footballer/ }));

    expect(await screen.findByText('Last name is required')).toBeInTheDocument();
    expect(onUpdateFootballer).not.toHaveBeenCalled();
  });

  it('refuses a wikipedia value that is not a URL', async () => {
    const { onUpdateFootballer } = renderForm();

    fireEvent.change(screen.getByLabelText('Wikipedia URL'), { target: { value: 'en.wikipedia.org' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Footballer/ }));

    expect(await screen.findByText('Must start with http:// or https://')).toBeInTheDocument();
    expect(onUpdateFootballer).not.toHaveBeenCalled();
  });

  it('keeps game availability on its own tab, away from the profile fields', () => {
    // The two are edited on different occasions — names when a footballer is
    // added, availability when content is tuned — and one long scroll made the
    // second job hunt through the first.
    renderForm();

    expect(screen.queryByLabelText('Career Path')).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Game availability' }));

    expect(screen.getByText('Career Path')).toBeInTheDocument();
  });

  it('shows nothing to edit until a footballer is loaded', () => {
    renderForm({ footballerToUpdate: null });

    expect(screen.queryByLabelText('Last name *')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Footballer ID')).toBeInTheDocument();
  });
});
