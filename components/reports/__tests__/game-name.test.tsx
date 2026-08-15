import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { gameName } from '@/hooks/use-game-meta';

describe('gameName', () => {
  it('uses the game name, not the metric title', () => {
    // `label` is a dashboard card title: right above a number, wrong in a table
    // row, where eleven rows all ended in "... Game Sessions".
    expect(gameName({ key: 'grid', label: 'Grid Game Sessions', display_name: 'Grid', color: '#f97316' }, 'grid'))
      .toBe('Grid');
  });

  it('falls back to the label while a backend without display_name is deployed', () => {
    // A clumsy name beats a raw slug during the window between deploys.
    expect(gameName({ key: 'grid', label: 'Grid Game Sessions', color: '#f97316' }, 'grid'))
      .toBe('Grid Game Sessions');
  });

  it('prettifies the key for a game the backend has not described', () => {
    expect(gameName(undefined, 'brand_new_game')).toBe('Brand New Game');
  });

  it('does not fall through to the slug when display_name is an empty string', () => {
    // An empty display_name is a data problem, not a reason to show a slug.
    expect(gameName({ key: 'grid', label: 'Grid Game Sessions', display_name: '', color: '#f97316' }, 'grid'))
      .toBe('Grid Game Sessions');
  });
});

describe('gameBadge', () => {
  it('renders the game name', () => {
    render(
      <GameBadge
        gameKey="career_path"
        meta={{ career_path: { key: 'career_path', label: 'CareerPath Game Sessions', display_name: 'Career Path', color: '#6d28d9' } }}
      />,
    );

    expect(screen.getByText('Career Path')).toBeInTheDocument();
    expect(screen.queryByText(/Game Sessions/)).not.toBeInTheDocument();
  });
});
