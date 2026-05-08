import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: { getNations: vi.fn() },
}));

import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { FootballerAPI } from '@/lib/footballer-api';

const mockGetNations = vi.mocked(FootballerAPI.getNations);

const NATIONS = [
  { id: 1, name: 'Portugal', nationality: 'Portuguese', short: 'POR' },
  { id: 2, name: 'Brazil', nationality: 'Brazilian', short: 'BRA' },
  { id: 3, name: 'Argentina', nationality: 'Argentine', short: 'ARG' },
];

describe('NationCombobox', () => {
  beforeEach(() => {
    mockGetNations.mockReset();
    mockGetNations.mockResolvedValue(NATIONS);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the placeholder when no value is set', () => {
    render(<NationCombobox value={null} onChange={vi.fn()} placeholder="Pick one" />);
    // Placeholder is rendered as the trigger's visible content.
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('renders the selected nation name + short code in the trigger when value is set', async () => {
    // The trigger's selected display is derived from the loaded list,
    // so we open once to load nations, close, then re-render with a
    // value. The trigger shows the nation alongside the short code in
    // a small span.
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<NationCombobox value={null} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByText('Argentina');
    await user.keyboard('{Escape}');

    rerender(<NationCombobox value={2} onChange={onChange} />);
    // After close + rerender there's only one "Brazil" in the DOM
    // (inside the trigger). The "(BRA)" code in the trigger is the
    // unique signal we use here.
    await waitFor(() => expect(screen.getByText(/\(BRA\)/)).toBeInTheDocument());
  });

  it('lazy-loads the nation list on first open and skips the second open', async () => {
    const user = userEvent.setup();
    render(<NationCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByText('Argentina');
    expect(mockGetNations).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('combobox'));
    await screen.findByText('Argentina');
    // Cached — no second fetch.
    expect(mockGetNations).toHaveBeenCalledTimes(1);
  });

  it('filters by name, nationality, and short code (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<NationCombobox value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await screen.findByText('Argentina');

    const input = screen.getByPlaceholderText(/Search nation/);
    await user.type(input, 'arg');
    // The debounce settles within ~100ms; waitFor handles the delay.
    await waitFor(() => {
      expect(screen.queryByText('Brazil')).not.toBeInTheDocument();
      expect(screen.getByText('Argentina')).toBeInTheDocument();
    });

    await user.clear(input);
    await user.type(input, 'POR');
    await waitFor(() => {
      expect(screen.queryByText('Argentina')).not.toBeInTheDocument();
      expect(screen.getByText('Portugal')).toBeInTheDocument();
    });
  });

  it('clicking a row fires onChange with the picked nation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NationCombobox value={null} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    const row = await screen.findByText('Brazil');
    await user.click(row);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2, NATIONS[1]);
  });

  it('hides nations passed in excludeIds', async () => {
    const user = userEvent.setup();
    render(<NationCombobox value={null} onChange={vi.fn()} excludeIds={[2]} />);
    await user.click(screen.getByRole('combobox'));
    await screen.findByText('Argentina');
    expect(screen.queryByText('Brazil')).not.toBeInTheDocument();
  });
});
