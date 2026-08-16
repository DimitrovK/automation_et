import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataBar } from '@/components/reports/primitives/DataBar';
import { CAREER_STATE, DIFFICULTY_TIERS, difficultyTier } from '@/lib/data-colours';

function fill(container: HTMLElement) {
  return container.querySelector('[role="img"] > div') as HTMLElement;
}

describe('dataBar', () => {
  it('encodes the value as length against the shared max', () => {
    const { container } = render(<DataBar value={25} max={100} colour="bg-primary" label="quarter" />);

    expect(fill(container)).toHaveStyle({ width: '25%' });
  });

  it('clamps a value past the max instead of overflowing the card', () => {
    const { container } = render(<DataBar value={150} max={100} colour="bg-primary" label="over" />);

    expect(fill(container)).toHaveStyle({ width: '100%' });
  });

  it('draws nothing rather than dividing by zero', () => {
    const { container } = render(<DataBar value={5} max={0} colour="bg-primary" label="empty" />);

    expect(fill(container)).toHaveStyle({ width: '0%' });
  });

  it('is announced, because a bar with no text is silent', () => {
    render(<DataBar value={3} max={10} colour="bg-primary" label="Hard: 3 of 10 have a picture" />);

    expect(screen.getByRole('img', { name: 'Hard: 3 of 10 have a picture' })).toBeInTheDocument();
  });

  it('rounds only the data end, so every bar starts on one line', () => {
    // A rounded start pulls the eye off the baseline and shortens short bars
    // visually more than long ones, which is the comparison the bar is for.
    const { container } = render(<DataBar value={5} max={10} colour="bg-primary" label="half" />);

    expect(fill(container).className).toContain('rounded-r-');
    expect(fill(container).className).not.toContain('rounded-full');
  });

  it('carries no gradient', () => {
    // The single thing that dated the old bars: a gradient makes the same value
    // look different at different lengths.
    const { container } = render(<DataBar value={5} max={10} colour="bg-emerald-500" label="half" />);

    expect(fill(container).className).not.toContain('gradient');
  });
});

describe('data colours', () => {
  it('gives every difficulty its own hue', () => {
    // The bug this replaces: all four tiers rendered in one emerald gradient,
    // so Extreme and Easy were the same bar.
    const bars = Object.values(DIFFICULTY_TIERS).map(t => t.bar);

    expect(new Set(bars).size).toBe(bars.length);
  });

  it('runs difficulty cool to hot, in scale order', () => {
    expect(Object.keys(DIFFICULTY_TIERS)).toEqual(['EASY', 'NORMAL', 'HARD', 'EXTREME']);
  });

  it('names an unknown tier rather than dropping it', () => {
    expect(difficultyTier('LEGENDARY').label).toBe('LEGENDARY');
  });

  it('keeps the two career-state colours apart', () => {
    // They sit in one stacked bar; identical hues would make the split invisible.
    expect(CAREER_STATE.active.hex).not.toBe(CAREER_STATE.retired.hex);
  });
});
