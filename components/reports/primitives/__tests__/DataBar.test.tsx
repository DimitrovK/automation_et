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

  it('sits as a pill inside its own rail', () => {
    // Each bar has its own track on its own row, so lengths are compared within
    // a row rather than across a shared axis — which is what the earlier
    // square-baseline version was protecting, and it is not the shape here.
    const { container } = render(<DataBar value={5} max={10} colour="bg-primary" label="half" />);
    const track = container.querySelector('[role="img"]') as HTMLElement;

    expect(track.className).toContain('rounded-full');
    expect(fill(container).className).toContain('rounded-full');
  });

  it('keeps the track visible enough to show the full extent', () => {
    // The first version used a 6% track at 6px tall and the bars read as
    // nothing at all. A bar you cannot find is not a thinner bar.
    const { container } = render(<DataBar value={5} max={10} colour="bg-primary" label="half" />);
    const track = container.querySelector('[role="img"]') as HTMLElement;

    const opacity = Number(/bg-foreground\/\[([\d.]+)\]/.exec(track.className)?.[1] ?? 0);

    expect(opacity).toBeGreaterThanOrEqual(0.08);
    // And tall enough to be a bar rather than a rule.
    expect(track.className).toMatch(/h-2(\.5)?|h-3/);
  });

  it('runs its gradient ALONG the bar, never across it', () => {
    // A gradient across the height is the dated one — it shades a bar darker at
    // the bottom for no reason. Along the length is a direction the eye already
    // reads, and it is what was asked for.
    for (const tier of Object.values(DIFFICULTY_TIERS)) {
      expect(tier.bar).toContain('bg-gradient-to-r');
    }
  });

  it('rails each bar in its own hue, not in grey', () => {
    // A neutral rail reads as chrome rather than as part of the measurement.
    for (const tier of Object.values(DIFFICULTY_TIERS)) {
      expect(tier.track).toMatch(/(green|blue|orange|red)-\d{3}\/\d+/);
    }

    expect(CAREER_STATE.retired.track).not.toContain('slate');
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

  it('uses the agreed hues: green, blue, orange, red', () => {
    // Pinned because they were chosen by eye and the previous set was
    // unreadable — amber especially. A silent repaint should fail here.
    expect(DIFFICULTY_TIERS.EASY.bar).toContain('green');
    expect(DIFFICULTY_TIERS.NORMAL.bar).toContain('blue');
    expect(DIFFICULTY_TIERS.HARD.bar).toContain('orange');
    expect(DIFFICULTY_TIERS.EXTREME.bar).toContain('red');
  });

  it('fills matrix cells solidly rather than by opacity', () => {
    // The bug this replaces: cells were tinted by their share of the row and
    // floored at 12% opacity, so a real value could render nearly invisible.
    for (const tier of Object.values(DIFFICULTY_TIERS)) {
      expect(tier.chip).not.toContain('/[var(--tint)]');
      expect(tier.chip).toMatch(/text-(white|\w+-\d{2,3})/);
    }
  });

  it('gives the gradient three stops with different ends, in both themes', () => {
    // Same shade at both ends is a flat fill wearing a gradient class. And two
    // stops — neutral straight to saturated — reads as brushed metal, which is
    // why the middle stop is required rather than optional.
    for (const [name, tier] of Object.entries(DIFFICULTY_TIERS)) {
      // `via-` sits between the ends now, so the pattern has to step over it.
      const light = /(?:^| )from-\w+-(\d+) via-\w+-\d+ to-\w+-(\d+)/.exec(tier.chip);

      expect(light, `${name} has no light gradient`).not.toBeNull();
      expect(light![1], `${name} light ends match`).not.toBe(light![2]);

      const dark = /dark:from-\w+-(\d+) dark:via-\w+-\d+ dark:to-\w+-(\d+)/.exec(tier.chip);

      expect(dark, `${name} has no dark gradient`).not.toBeNull();
      expect(dark![1], `${name} dark ends match`).not.toBe(dark![2]);
    }
  });

  it('gives every tile a light-theme AND a dark-theme fill', () => {
    // A dark tile on a light page is a hole punched in it, and the reverse is
    // just as wrong — this shape has to belong to whichever surface it is on.
    for (const [name, tier] of Object.entries(DIFFICULTY_TIERS)) {
      expect(tier.chip, `${name} has no dark-theme fill`).toMatch(/dark:(from|to)-/);
      expect(tier.chip, `${name} has no dark-theme text`).toMatch(/dark:text-/);
      expect(tier.chipAlt, `${name} alt has no dark-theme fill`).toMatch(/dark:(from|to)-/);
    }
  });

  it('keeps the two career-state colours apart', () => {
    // They sit in one stacked bar; identical hues would make the split invisible.
    expect(CAREER_STATE.active.hex).not.toBe(CAREER_STATE.retired.hex);
  });
});
