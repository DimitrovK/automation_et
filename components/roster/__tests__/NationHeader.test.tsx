import type { FootballerNation } from '@/types/player';
import type { NationHeaderInfo } from '@/types/team';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NationHeader } from '@/components/roster/NationHeader';

const england: NationHeaderInfo = {
  id: 5,
  name: 'England',
  short: 'ENG',
  flag: null,
  total_footballers: 3056,
  total_spells: 9323,
  total_clubs: 323,
};

const brazilian: FootballerNation = { id: 76, name: 'Brazil', nationality: 'Brazilian', short: 'BRA' };

describe('nationHeader', () => {
  it('describes the whole country when nothing narrows it', () => {
    render(<NationHeader nation={england} />);

    expect(screen.getByText('Everyone who played for a club in this country')).toBeInTheDocument();
    expect(screen.getByText('3,056')).toBeInTheDocument();
  });

  it('says what it is showing once a nationality narrows it', () => {
    // The card is the first thing read, so it is the thing that has to keep up.
    // It said "everyone who played here" while the list below showed Brazilians.
    render(<NationHeader nation={england} nationality={brazilian} matchCount={122} />);

    expect(
      screen.getByText('Brazilian footballers who played for a club in England'),
    ).toBeInTheDocument();
    expect(screen.getByText('122 Brazilian')).toBeInTheDocument();
    expect(screen.getByText('of 3,056')).toBeInTheDocument();
  });

  it('can drop the filter from where the filter is described', () => {
    const onClearNationality = vi.fn();
    render(
      <NationHeader
        nation={england}
        nationality={brazilian}
        matchCount={122}
        onClearNationality={onClearNationality}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Clear the Brazilian filter/ }));

    expect(onClearNationality).toHaveBeenCalled();
  });
});
