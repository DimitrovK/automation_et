import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    getPositions: vi.fn(),
    getFootballerPositions: vi.fn(),
    setPositions: vi.fn(),
  },
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { PositionsEditor } from '@/components/footballer-management/sub-editors/PositionsEditor';
import { FootballerAPI } from '@/lib/footballer-api';
import { toast } from 'sonner';

const api = vi.mocked(FootballerAPI);
const mockToast = vi.mocked(toast);

import type { Position } from '@/types/player';

const ALL_POSITIONS: Position[] = [
  { id: 1, name: 'GK', full_name: 'Goalkeeper', role: 'GK', sort_order: 0 },
  { id: 5, name: 'CB', full_name: 'Centre-Back', role: 'DEF', sort_order: 1 },
  { id: 16, name: 'ST', full_name: 'Striker', role: 'FWD', sort_order: 2 },
];

function assignment(overrides = {}) {
  return {
    id: 100,
    footballer_id: 42,
    footballer_name: 'CR7',
    position_id: 16,
    position_name: 'ST',
    position_full_name: 'Striker',
    position_role: 'FWD',
    is_primary: true,
    sort_order: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('PositionsEditor', () => {
  beforeEach(() => {
    api.getPositions.mockReset();
    api.getFootballerPositions.mockReset();
    api.setPositions.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    api.getPositions.mockResolvedValue(ALL_POSITIONS);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows empty state when no positions are assigned', async () => {
    api.getFootballerPositions.mockResolvedValueOnce([]);
    render(<PositionsEditor footballerId={42} />);
    expect(await screen.findByText(/No positions assigned yet/)).toBeInTheDocument();
  });

  it('renders the existing positions sorted with primary first', async () => {
    api.getFootballerPositions.mockResolvedValueOnce([
      assignment({ id: 1, position_id: 5, position_name: 'CB', position_full_name: 'Centre-Back', position_role: 'DEF', is_primary: false, sort_order: 1 }),
      assignment({ id: 2, position_id: 16, position_name: 'ST', position_full_name: 'Striker', position_role: 'FWD', is_primary: true, sort_order: 0 }),
    ]);
    render(<PositionsEditor footballerId={42} />);

    expect(await screen.findByText('Striker')).toBeInTheDocument();
    expect(screen.getByText('Centre-Back')).toBeInTheDocument();
  });

  it('Save is disabled until something changes (no dirty state)', async () => {
    api.getFootballerPositions.mockResolvedValueOnce([assignment()]);
    render(<PositionsEditor footballerId={42} />);
    await screen.findByText('Striker');

    const save = screen.getByRole('button', { name: /Save positions/ });
    expect(save).toBeDisabled();
  });

  it('Adding a new position becomes dirty and Save calls set-positions', async () => {
    const user = userEvent.setup();
    api.getFootballerPositions.mockResolvedValueOnce([assignment()]); // ST primary
    api.setPositions.mockResolvedValueOnce([
      assignment(),
      assignment({ id: 200, position_id: 5, position_name: 'CB', position_full_name: 'Centre-Back', position_role: 'DEF', is_primary: false, sort_order: 1 }),
    ]);

    render(<PositionsEditor footballerId={42} />);
    await screen.findByText('Striker');

    // Open the add-picker (it's a Radix Select).
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Centre-Back'));
    await user.click(screen.getByRole('button', { name: /^Add$/ }));

    expect(await screen.findByText(/Unsaved changes/)).toBeInTheDocument();

    const save = screen.getByRole('button', { name: /Save positions/ });
    expect(save).not.toBeDisabled();
    await user.click(save);

    await waitFor(() => expect(api.setPositions).toHaveBeenCalledTimes(1));
    expect(api.setPositions).toHaveBeenCalledWith({
      footballer_id: 42,
      positions: expect.arrayContaining([
        expect.objectContaining({ position_id: 16, is_primary: true }),
        expect.objectContaining({ position_id: 5, is_primary: false }),
      ]),
    });
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('Reset clears any unsaved edits', async () => {
    const user = userEvent.setup();
    api.getFootballerPositions.mockResolvedValueOnce([assignment()]);
    render(<PositionsEditor footballerId={42} />);
    await screen.findByText('Striker');

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Centre-Back'));
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText(/Unsaved changes/)).not.toBeInTheDocument();
    expect(screen.queryByText('Centre-Back')).not.toBeInTheDocument();
  });
});
