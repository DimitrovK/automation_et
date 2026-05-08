import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: { getNations: vi.fn() },
}));

import { NationsMultiSelect } from '@/components/footballer-management/NationsMultiSelect';
import { FootballerAPI } from '@/lib/footballer-api';

const mockGetNations = vi.mocked(FootballerAPI.getNations);

const NATIONS = [
  { id: 1, name: 'Portugal', nationality: 'Portuguese', short: 'POR' },
  { id: 2, name: 'Brazil', nationality: 'Brazilian', short: 'BRA' },
  { id: 3, name: 'Argentina', nationality: 'Argentine', short: 'ARG' },
];

describe('NationsMultiSelect', () => {
  beforeEach(() => {
    mockGetNations.mockReset();
    mockGetNations.mockResolvedValue(NATIONS);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the empty-state message when no nations are picked', () => {
    render(<NationsMultiSelect value={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/No secondary nationalities/)).toBeInTheDocument();
  });

  it('renders each selected nation as a removable chip', () => {
    render(
      <NationsMultiSelect
        value={[NATIONS[0], NATIONS[1]]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Portugal')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Portugal')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Brazil')).toBeInTheDocument();
  });

  it('clicking a chip remove button drops it from the value array', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NationsMultiSelect value={[NATIONS[0], NATIONS[1]]} onChange={onChange} />);

    await user.click(screen.getByLabelText('Remove Portugal'));
    expect(onChange).toHaveBeenCalledWith([NATIONS[1]]);
  });

  it('the inline combobox excludes already-selected ids', async () => {
    const user = userEvent.setup();
    render(<NationsMultiSelect value={[NATIONS[0]]} onChange={vi.fn()} />);

    // Open the combobox under the chips.
    await user.click(screen.getByText(/Add a secondary/));
    // Portugal (id=1) is in `value` so it must NOT appear in the dropdown.
    await screen.findByText('Brazil');
    expect(screen.queryAllByText('Portugal')).toHaveLength(1); // the chip only — not the dropdown row
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('picking a new nation appends it to the existing list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NationsMultiSelect value={[NATIONS[0]]} onChange={onChange} />);

    await user.click(screen.getByText(/Add a secondary/));
    await user.click(await screen.findByText('Argentina'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([NATIONS[0], NATIONS[2]]);
  });

  it('extra excludeIds (e.g. the primary nation) are also filtered out', async () => {
    const user = userEvent.setup();
    render(<NationsMultiSelect value={[]} onChange={vi.fn()} excludeIds={[1]} />);

    await user.click(screen.getByText(/Add a secondary/));
    await screen.findByText('Brazil');
    expect(screen.queryByText('Portugal')).not.toBeInTheDocument();
  });
});
