import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameBadge } from '@/components/reports/GameBadge';
import { FALLBACK_COLOR, gameColor } from '@/hooks/use-game-meta';

const GRID = { key: 'grid', label: 'Grid', color: '#f97316', color_dark: '#fdba74' };

describe('gameColor', () => {
  it('uses the dark step on a dark surface', () => {
    // Not cosmetic: the light step sits at 2.2-2.8:1 on the dark card for five
    // games, which reads as a smudge rather than a colour.
    expect(gameColor(GRID, true)).toBe('#fdba74');
    expect(gameColor(GRID, false)).toBe('#f97316');
  });

  it('falls back to the light colour when the BE predates color_dark', () => {
    // Degrading to grey here would drop game identity entirely during the
    // window between the BE and FE deploys.
    const legacy = { key: 'grid', label: 'Grid', color: '#f97316' };

    expect(gameColor(legacy, true)).toBe('#f97316');
  });

  it('falls back to grey for a game the BE has not described', () => {
    expect(gameColor(undefined, false)).toBe(FALLBACK_COLOR);
    expect(gameColor(undefined, true)).toBe(FALLBACK_COLOR);
  });
});

describe('game marks', () => {
  it('always carry their name, because four light colours are under 3:1', () => {
    // The palette is only legal with "relief" — a visible label. If a badge
    // ever renders as colour alone, the contrast exemption stops holding and
    // the mark becomes unreadable for anyone who can't resolve the hue.
    render(<GameBadge gameKey="grid" meta={{ grid: GRID }} />);

    expect(screen.getByText('Grid')).toBeTruthy();
  });

  it('names an unknown game readably rather than showing a bare swatch', () => {
    // BE game keys are snake_case. prettySlug only split on hyphens, so the
    // multiplayer table was rendering "Club_connection" on screen.
    render(<GameBadge gameKey="brand_new_game" meta={{}} />);

    expect(screen.getByText('Brand New Game')).toBeTruthy();
  });
});
