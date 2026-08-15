import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RollupHealthBanner } from '@/components/reports/panels/RollupHealthBanner';
import { ReportsAPI } from '@/lib/reports-api';

function health(overrides = {}) {
  return {
    has_data: true,
    earliest: '2026-05-14',
    latest: '2026-08-11',
    days_covered: 90,
    gap_count: 0,
    gaps: [],
    gaps_truncated: false,
    stale_days: 1,
    suggested_command: null,
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('rollupHealthBanner', () => {
  it('stays silent when the rollup is complete and current', async () => {
    // A banner that is always there is one people stop reading. One day behind
    // is the normal state between nightly runs, not a problem.
    vi.spyOn(ReportsAPI, 'getRollupHealth').mockResolvedValue(health() as never);

    const { container } = render(<RollupHealthBanner />);
    await new Promise(resolve => setTimeout(resolve, 30));

    expect(container).toBeEmptyDOMElement();
  });

  it('warns about holes inside the covered range', async () => {
    vi.spyOn(ReportsAPI, 'getRollupHealth').mockResolvedValue(health({
      gap_count: 3,
      suggested_command: 'python manage.py backfill_daily_game_activity --start 2026-06-01 --end 2026-06-03',
    }) as never);

    render(<RollupHealthBanner />);

    expect(await screen.findByText(/3 days inside the covered range were never computed/)).toBeInTheDocument();
    expect(screen.getByText(/--start 2026-06-01/)).toBeInTheDocument();
  });

  it('distinguishes a stale rollup from one with holes', async () => {
    // Different problems with different fixes: one needs catching up, the other
    // needs specific days rebuilt.
    vi.spyOn(ReportsAPI, 'getRollupHealth').mockResolvedValue(health({
      stale_days: 6,
      suggested_command: 'python manage.py backfill_daily_game_activity --start 2026-08-07 --end 2026-08-12',
    }) as never);

    render(<RollupHealthBanner />);

    expect(await screen.findByText(/6 days behind/)).toBeInTheDocument();
  });

  it('says an empty rollup makes every figure unknown, not zero', async () => {
    vi.spyOn(ReportsAPI, 'getRollupHealth').mockResolvedValue(health({
      has_data: false,
      days_covered: 0,
      stale_days: null,
      suggested_command: 'python manage.py backfill_daily_game_activity --days 90',
    }) as never);

    render(<RollupHealthBanner />);

    expect(await screen.findByText(/unknown rather than zero/)).toBeInTheDocument();
  });

  it('bounds the warning by saying what IS covered', async () => {
    // Three missing days out of ninety is a very different problem from three
    // days being the entire dataset.
    vi.spyOn(ReportsAPI, 'getRollupHealth').mockResolvedValue(health({
      gap_count: 3,
      suggested_command: 'python manage.py backfill_daily_game_activity',
    }) as never);

    render(<RollupHealthBanner />);

    expect(await screen.findByText(/90 days computed/)).toBeInTheDocument();
    expect(screen.getByText(/2026-05-14/)).toBeInTheDocument();
  });

  it('does not take the page down when the check itself fails', async () => {
    // The reports are still readable; we just can't vouch for the rollup.
    vi.spyOn(ReportsAPI, 'getRollupHealth').mockRejectedValue(new Error('offline'));

    const { container } = render(<RollupHealthBanner />);
    await new Promise(resolve => setTimeout(resolve, 30));

    expect(container).toBeEmptyDOMElement();
  });
});
