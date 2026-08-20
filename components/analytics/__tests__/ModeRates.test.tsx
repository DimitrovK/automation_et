import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModeRates } from '@/components/analytics/panels/ModeRates';

// No recharts mock any more. The old chart could not be asserted at all — jsdom
// gives recharts a zero-size container, so nothing rendered and the suite could
// only check the prose around it. That blind spot hid a real bug for several
// releases: the per-bar labels were built with a `LabelList` whose `content`
// returned a string instead of an element, so the shipped chart had NO numbers
// on it. These tests now read the figures out of the DOM.
function data(modes: CareerPathAnalyticsResponse['shape']['modes']): CareerPathAnalyticsResponse {
  return { shape: { modes } } as unknown as CareerPathAnalyticsResponse;
}

const SINGLE = { mode: 'SINGLE', paths: 100, appearances: 25131, solve_rate_pct: 70.8, help_rate_pct: 2.6 };
const HEAD_TO_HEAD = { mode: 'HEAD_TO_HEAD', paths: 58, appearances: 2794, solve_rate_pct: 83.8, help_rate_pct: 2.1 };
const RARE = { mode: 'RACE', paths: 2, appearances: 12, solve_rate_pct: 58.7, help_rate_pct: 5.1 };

describe('modeRates', () => {
  it('prints the rate on every row', () => {
    // The bug this replaces: seven bars and not a single number on any of them.
    render(<ModeRates data={data([SINGLE, HEAD_TO_HEAD])} />);

    expect(screen.getByText('70.8%')).toBeInTheDocument();
    expect(screen.getByText('83.8%')).toBeInTheDocument();
  });

  it('holds one decimal even when the rate is a whole number', () => {
    // A "66%" in a column of "74.6%" reads as a different precision.
    render(<ModeRates data={data([{ ...SINGLE, solve_rate_pct: 66 }])} />);

    expect(screen.getByText('66.0%')).toBeInTheDocument();
  });

  it('never shows a rate without the sample behind it', () => {
    // The whole page withholds rates under a threshold for this reason. A rate
    // printed alone, one card after that rule, undoes it.
    render(<ModeRates data={data([SINGLE])} />);

    expect(screen.getByText('of 25,131')).toBeInTheDocument();
  });

  it('names modes the way the rest of the surface does', () => {
    // `head to head` here and `Head To Head` on the multiplayer page was two
    // spellings of one mode, from two copies of the same formatter.
    render(<ModeRates data={data([SINGLE, HEAD_TO_HEAD])} />);

    expect(screen.getByText('Head to Head')).toBeInTheDocument();
    expect(screen.getByText('Single')).toBeInTheDocument();
  });

  it('ranks by rate, hardest last', () => {
    render(<ModeRates data={data([SINGLE, HEAD_TO_HEAD])} />);

    const labels = screen.getAllByRole('term').map(node => node.textContent);

    expect(labels).toEqual(['Head to Head', 'Single']);
  });

  it('leads with how much the mode actually matters', () => {
    // The card's whole claim is that the mode moves the solve rate about as
    // much as the editorial grading does. That claim was nowhere on the card.
    render(<ModeRates data={data([SINGLE, HEAD_TO_HEAD])} />);

    expect(screen.getByText('13.0 points')).toBeInTheDocument();
    expect(screen.getByText('70.8% in Single to 83.8% in Head to Head')).toBeInTheDocument();
  });

  it('does not claim a spread from a single mode', () => {
    // Zero points would read as "the mode makes no difference" rather than
    // "there is nothing to compare it with".
    render(<ModeRates data={data([SINGLE])} />);

    expect(screen.queryByText(/points/)).not.toBeInTheDocument();
  });

  it('scales the bars to 100, not to the best mode', () => {
    // Scaled to the leader, an 83.8% and a 70.8% become a full bar against a
    // five-sixths one, which reads as a far bigger gap than there is.
    render(<ModeRates data={data([SINGLE, HEAD_TO_HEAD])} />);

    expect(screen.getByText(/Bars run to 100%/)).toBeInTheDocument();
  });

  it('names the modes it left out rather than dropping them silently', () => {
    // A mode missing from the list reads as a mode nobody plays, which is a
    // different fact from one nobody has played enough to rate. A count alone
    // does not resolve it either — the reader cannot tell WHICH row is missing
    // (Copilot on #127).
    render(<ModeRates data={data([SINGLE, RARE])} />);

    expect(screen.getByText(/under 30 appearances.*Race/)).toBeInTheDocument();
  });

  it('separates "too few to rate" from "nothing to rate at all"', () => {
    // Two different reasons drop a mode, and one message for both picks the
    // wrong one for somebody.
    render(
      <ModeRates
        data={data([SINGLE, RARE, { mode: 'SUDDEN_DEATH', paths: 0, appearances: 0, solve_rate_pct: null, help_rate_pct: null }])}
      />,
    );

    expect(screen.getByText(/under 30 appearances.*Race/)).toBeInTheDocument();
    expect(screen.getByText(/No appearances to rate at all: Sudden Death/)).toBeInTheDocument();
  });

  it('says nothing about omissions when every mode qualifies', () => {
    render(<ModeRates data={data([SINGLE])} />);

    expect(screen.queryByText(/Left out/)).not.toBeInTheDocument();
  });

  it('shows an empty state when no mode has enough appearances', () => {
    render(<ModeRates data={data([RARE])} />);

    expect(screen.getByText('No mode has enough appearances to rate.')).toBeInTheDocument();
    // And drops the axis note with it — there are no bars for it to describe.
    expect(screen.queryByText(/Bars run to 100%/)).not.toBeInTheDocument();
  });
});
