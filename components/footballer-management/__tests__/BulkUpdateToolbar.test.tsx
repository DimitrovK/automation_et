import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: { bulkUpdateFootballers: vi.fn() },
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { BulkUpdateToolbar } from '@/components/footballer-management/BulkUpdateToolbar';
import { FootballerAPI } from '@/lib/footballer-api';
import { toast } from 'sonner';

const mockBulk = vi.mocked(FootballerAPI.bulkUpdateFootballers);
const mockSuccess = vi.mocked(toast.success);
const mockError = vi.mocked(toast.error);

function renderToolbar(opts: {
  selected?: number[];
  visible?: number[];
} = {}) {
  const visible = opts.visible ?? [1, 2, 3];
  const selected = new Set(opts.selected ?? []);
  const onSelectionChange = vi.fn<(ids: Set<number>) => void>();
  const onApplied = vi.fn<() => void>();

  return {
    onSelectionChange,
    onApplied,
    ...render(
      <BulkUpdateToolbar
        visibleIds={visible}
        selectedIds={selected}
        onSelectionChange={onSelectionChange}
        onApplied={onApplied}
      />,
    ),
  };
}

describe('BulkUpdateToolbar', () => {
  beforeEach(() => {
    mockBulk.mockReset();
    mockSuccess.mockReset();
    mockError.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('starts with no selection summary and bulk-actions disabled', () => {
    renderToolbar();
    expect(screen.getByText('No footballers selected.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bulk actions/ })).toBeDisabled();
  });

  it('Select all populates the selection set with the visible ids', async () => {
    const user = userEvent.setup();
    const { onSelectionChange } = renderToolbar();
    await user.click(screen.getByRole('button', { name: /Select all/ }));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const passed = onSelectionChange.mock.calls[0][0];
    expect(Array.from(passed).sort()).toEqual([1, 2, 3]);
  });

  it('Deselect all clears the set when everything is currently selected', async () => {
    const user = userEvent.setup();
    const { onSelectionChange } = renderToolbar({ selected: [1, 2, 3] });
    await user.click(screen.getByRole('button', { name: /Deselect all/ }));
    expect(onSelectionChange.mock.calls[0][0].size).toBe(0);
  });

  it('does not allow Apply until both rows AND fields are picked', async () => {
    const user = userEvent.setup();
    renderToolbar({ selected: [1, 2] });
    await user.click(screen.getByRole('button', { name: /Bulk actions/ }));

    const applyBtn = screen.getByRole('button', { name: /Apply to 2 footballers/ });
    expect(applyBtn).toBeDisabled();
  });

  it('calls bulkUpdateFootballers with selected ids and chosen flags', async () => {
    const user = userEvent.setup();
    mockBulk.mockResolvedValueOnce({ updated: 2, ids: [1, 2], applied: { retired: true } });
    const { onSelectionChange, onApplied } = renderToolbar({ selected: [1, 2] });

    await user.click(screen.getByRole('button', { name: /Bulk actions/ }));
    await user.click(screen.getByRole('switch', { name: 'Retired' }));

    await user.click(screen.getByRole('button', { name: /Apply to 2 footballers/ }));

    await waitFor(() => expect(mockBulk).toHaveBeenCalledTimes(1));
    expect(mockBulk).toHaveBeenCalledWith([1, 2], { retired: true });

    // After success: toast, selection cleared, callback fired.
    await waitFor(() => expect(mockSuccess).toHaveBeenCalled());
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('surfaces backend errors via the error toast', async () => {
    const user = userEvent.setup();
    mockBulk.mockRejectedValueOnce(new Error('Forbidden — staff only.'));
    renderToolbar({ selected: [42] });

    await user.click(screen.getByRole('button', { name: /Bulk actions/ }));
    await user.click(screen.getByRole('switch', { name: 'Retired' }));
    await user.click(screen.getByRole('button', { name: /Apply to 1 footballer/ }));

    await waitFor(() => expect(mockError).toHaveBeenCalledWith('Forbidden — staff only.'));
  });
});
