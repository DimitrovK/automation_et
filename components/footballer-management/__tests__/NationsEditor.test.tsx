import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    getFootballerNations: vi.fn(),
    createFootballerNation: vi.fn(),
    updateFootballerNation: vi.fn(),
    deleteFootballerNation: vi.fn(),
    getNations: vi.fn(),
  },
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { NationsEditor } from '@/components/footballer-management/sub-editors/NationsEditor';
import { FootballerAPI } from '@/lib/footballer-api';
import { toast } from 'sonner';

const api = vi.mocked(FootballerAPI);
const mockToast = vi.mocked(toast);

const POR = { id: 1, name: 'Portugal', nationality: 'Portuguese', short: 'POR' };
const BRA = { id: 2, name: 'Brazil', nationality: 'Brazilian', short: 'BRA' };

function statRow(over = {}) {
  return {
    id: 10,
    footballer_id: 42,
    footballer_name: 'CR7',
    nation_id: POR.id,
    nation_name: POR.name,
    apps: 196,
    goals: 130,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...over,
  };
}

describe('NationsEditor', () => {
  beforeEach(() => {
    api.getFootballerNations.mockReset();
    api.createFootballerNation.mockReset();
    api.updateFootballerNation.mockReset();
    api.deleteFootballerNation.mockReset();
    api.getNations.mockReset();
    api.getNations.mockResolvedValue([POR, BRA]);
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders empty-state when there are no national stats', async () => {
    api.getFootballerNations.mockResolvedValueOnce([]);
    render(<NationsEditor footballerId={42} eligibleNations={[POR]} />);
    expect(await screen.findByText(/No international stats yet/)).toBeInTheDocument();
  });

  it('renders rows from the API', async () => {
    api.getFootballerNations.mockResolvedValueOnce([statRow()]);
    render(<NationsEditor footballerId={42} eligibleNations={[POR]} />);
    expect(await screen.findByText('Portugal')).toBeInTheDocument();
    expect(screen.getByText('196')).toBeInTheDocument();
    expect(screen.getByText('130')).toBeInTheDocument();
  });

  it('Add nation flow rejects empty nation pick', async () => {
    const user = userEvent.setup();
    api.getFootballerNations.mockResolvedValueOnce([]);
    render(<NationsEditor footballerId={42} eligibleNations={[POR, BRA]} />);
    await screen.findByText(/No international stats/);

    await user.click(screen.getByRole('button', { name: /Add nation/ }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(api.createFootballerNation).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith('Pick a nation.');
  });

  it('Add nation flow POSTs payload on save', async () => {
    const user = userEvent.setup();
    api.getFootballerNations.mockResolvedValueOnce([]);
    api.createFootballerNation.mockResolvedValueOnce(statRow({ id: 99, nation_id: BRA.id, nation_name: BRA.name }));
    api.getFootballerNations.mockResolvedValueOnce([statRow({ id: 99, nation_id: BRA.id, nation_name: BRA.name })]);

    render(<NationsEditor footballerId={42} eligibleNations={[POR, BRA]} />);
    await screen.findByText(/No international stats/);
    await user.click(screen.getByRole('button', { name: /Add nation/ }));

    // Pick Brazil from the inline NationCombobox.
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Brazil'));

    await user.type(screen.getByLabelText('Apps'), '99');
    await user.type(screen.getByLabelText('Goals'), '60');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(api.createFootballerNation).toHaveBeenCalledTimes(1));
    expect(api.createFootballerNation).toHaveBeenCalledWith({
      footballer_id: 42,
      nation_id: BRA.id,
      apps: 99,
      goals: 60,
    });
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('Delete row calls the API after confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.getFootballerNations.mockResolvedValueOnce([statRow({ id: 10 })]);
    api.deleteFootballerNation.mockResolvedValueOnce(undefined as never);
    api.getFootballerNations.mockResolvedValueOnce([]);

    render(<NationsEditor footballerId={42} eligibleNations={[POR]} />);
    const row = await screen.findByRole('row', { name: /Portugal/ });
    await user.click(within(row).getByLabelText('Delete Portugal'));

    await waitFor(() => expect(api.deleteFootballerNation).toHaveBeenCalledWith(10));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });
});
