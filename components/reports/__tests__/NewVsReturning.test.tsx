import type { NewReturningRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NewVsReturning } from '@/components/reports/NewVsReturning';

// recharts measures its container and jsdom reports zero, so the SVG never
// renders. What is worth asserting here is the branch above it — chart or empty
// state — which is exactly what the component decides.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

const ROWS: NewReturningRow[] = [
  { date: '2026-06-01', new_players: 12, returning_players: 40 },
  { date: '2026-06-02', new_players: 9, returning_players: 44 },
];

describe('newVsReturning', () => {
  it('says what the two bands mean, since neither is readable alone', () => {
    render(<NewVsReturning rows={ROWS} />);

    expect(screen.getByText('New vs returning players')).toBeInTheDocument();
    expect(screen.getByText(/all returning means growth has stalled/)).toBeInTheDocument();
  });

  it('shows an empty state rather than an axis with nothing on it', () => {
    // A bare chart frame reads as "zero players", which is a measurement. No
    // rows is the absence of one.
    render(<NewVsReturning rows={[]} />);

    expect(screen.getByText('No player activity in this window.')).toBeInTheDocument();
  });
});
