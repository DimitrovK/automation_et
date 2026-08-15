import type { CoverageCheck, CoverageResponse } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataCoverage } from '@/components/analytics/panels/DataCoverage';

function check(over: Partial<CoverageCheck> & Pick<CoverageCheck, 'key' | 'label'>): CoverageCheck {
  return {
    breaks: 'Something breaks.',
    served_missing: 0,
    served_missing_pct: 0,
    unserved_missing: 0,
    ...over,
  };
}

function response(over: Partial<CoverageResponse> = {}): CoverageResponse {
  return {
    checks: [
      check({
        key: 'picture',
        label: 'Active picture',
        breaks: 'Scout serves the dossier with no image rather than failing, so this degrades quietly.',
        served_missing: 4609,
        served_missing_pct: 82.1,
        unserved_missing: 362,
      }),
      check({
        key: 'club',
        label: 'Club history',
        breaks: 'Career Path cannot build a path without it — the footballer is unusable there.',
        unserved_missing: 3,
      }),
    ],
    served: 5617,
    unserved: 365,
    by_difficulty: [
      { difficulty: 'HARD', served: 2272, picture: 1963, club: 0, nation: 0 },
      { difficulty: 'EASY', served: 954, picture: 672, club: 0, nation: 0 },
    ],
    ...over,
  } as unknown as CoverageResponse;
}

describe('dataCoverage', () => {
  it('keeps served and unserved gaps in separate columns', () => {
    // A gap in a row nothing serves costs nothing. One percentage across both
    // populations is true of neither.
    render(<DataCoverage data={response()} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('4,609');
    expect(cells[1]).toHaveTextContent('82.1%');
    expect(cells[2]).toHaveTextContent('362');
  });

  it('says what each gap breaks, because they are not equivalent', () => {
    // A missing club makes a footballer unusable; a missing picture degrades
    // quietly. A table listing both without that invites fixing the cheap one.
    render(<DataCoverage data={response()} />);

    expect(screen.getByText(/unusable there/)).toBeInTheDocument();
    expect(screen.getByText(/degrades quietly/)).toBeInTheDocument();
  });

  it('states a clean check rather than leaving it blank', () => {
    // A check earns its place by being able to say a thing is fine.
    render(<DataCoverage data={response()} />);
    const cells = within(screen.getAllByRole('row')[2]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('0');
  });

  it('reports "none" when nothing is missing at all', () => {
    render(
      <DataCoverage
        data={response({ checks: [check({ key: 'club', label: 'Club history' })] })}
      />,
    );

    expect(screen.getByText('none')).toBeInTheDocument();
  });

  it('breaks the picture gap down by difficulty, where it costs most', () => {
    // The footballers players most need a visual cue for are the hard ones.
    render(<DataCoverage data={response()} />);

    expect(screen.getByText('1,963 (86%)')).toBeInTheDocument();
    expect(screen.getByText('672 (70%)')).toBeInTheDocument();
  });
});
