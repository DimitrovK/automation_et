import type { FirstSessionResponse, FirstSessionRow } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FirstSessionFollowup } from '@/components/reports/panels/FirstSessionFollowup';

const META = {
  grid: { key: 'grid', label: 'Grid', display_name: 'Grid', color: '#f97316', color_dark: '#fdba74' },
  tenable: { key: 'tenable', label: 'Tenable', display_name: 'Tenable', color: '#b91c1c', color_dark: '#ef4444' },
} as never;

function row(over: Partial<FirstSessionRow> & Pick<FirstSessionRow, 'game_type'>): FirstSessionRow {
  return {
    new_players: 100,
    below_threshold: false,
    returned_24h: 40,
    returned_48h: 55,
    returned_168h: 70,
    returned_24h_pct: 40,
    returned_48h_pct: 55,
    returned_168h_pct: 70,
    ...over,
  };
}

function response(rows: FirstSessionRow[]): FirstSessionResponse {
  return {
    min_players: 20,
    total_new_players: rows.reduce((sum, r) => sum + r.new_players, 0),
    rows,
  } as unknown as FirstSessionResponse;
}

describe('firstSessionFollowup', () => {
  it('shows a rate and the count behind it', () => {
    render(<FirstSessionFollowup data={response([row({ game_type: 'grid' })])} meta={META} />);
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[2]).toHaveTextContent('40%');
    expect(cells[2]).toHaveTextContent('(40)');
  });

  it('withholds every rate below the threshold but still shows the count', () => {
    // "3 people started here" is a fact worth having; "33% came back" from three
    // people is not. Withholding one without the other would leave a blank row
    // that reads as no data at all.
    render(
      <FirstSessionFollowup
        data={response([row({ game_type: 'tenable', new_players: 3, below_threshold: true })])}
        meta={META}
      />,
    );
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('3');
    expect(screen.getAllByText('— 3 players, needs 20')).toHaveLength(3);
  });

  it('labels the windows as cumulative', () => {
    // The trap: read as disjoint bands, 40 / 55 / 70 looks like 165 people came
    // back out of 100. The headers have to say they contain each other.
    render(<FirstSessionFollowup data={response([row({ game_type: 'grid' })])} meta={META} />);

    expect(screen.getByTitle(/includes the 24h column/)).toBeInTheDocument();
    expect(screen.getByTitle(/includes both columns to its left/)).toBeInTheDocument();
  });

  it('links each starting game to its own report', () => {
    render(<FirstSessionFollowup data={response([row({ game_type: 'grid' })])} meta={META} />);

    expect(screen.getByRole('link', { name: /Grid/ })).toHaveAttribute('href', '/reports/games/grid');
  });

  it('says so when nobody started in the window', () => {
    render(<FirstSessionFollowup data={response([])} meta={META} />);

    expect(screen.getByText('Nobody played for the first time in this window.')).toBeInTheDocument();
  });
});
