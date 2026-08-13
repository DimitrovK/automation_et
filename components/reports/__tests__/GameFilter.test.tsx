import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameFilter } from '@/components/reports/GameFilter';

const META = {
  grid: { key: 'grid', label: 'Grid', color: '#f97316', color_dark: '#fdba74' },
  quiz: { key: 'quiz', label: 'Quiz', color: '#3b82f6', color_dark: '#3b82f6' },
  conquest: { key: 'conquest', label: 'Conquest', color: '#38bdf8', color_dark: '#7dd3fc' },
};

describe('gameFilter', () => {
  it('offers every registered game, not only ones with data', () => {
    // Built from the BE registry rather than the response on purpose: a game
    // with zero retention is exactly the one worth selecting, and a
    // data-derived list would hide it precisely when it matters.
    render(<GameFilter meta={META} value={null} onChange={() => {}} />);

    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Conquest')).toBeInTheDocument();
  });

  it('marks "All games" as the selected state when nothing is filtered', () => {
    render(<GameFilter meta={META} value={null} onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'All games' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('clears the filter when the active game is clicked again', async () => {
    // Without this the only way back to "all games" is finding the separate
    // button, and a filter you cannot undo where you set it is a trap.
    const onChange = vi.fn();
    render(<GameFilter meta={META} value="grid" onChange={onChange} />);

    await userEvent.click(screen.getByText('Grid'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('selects a game that is not currently active', async () => {
    const onChange = vi.fn();
    render(<GameFilter meta={META} value="grid" onChange={onChange} />);

    await userEvent.click(screen.getByText('Quiz'));

    expect(onChange).toHaveBeenCalledWith('quiz');
  });

  it('renders nothing before the registry has loaded', () => {
    // Better an absent control than an empty one that looks broken.
    const { container } = render(<GameFilter meta={{}} value={null} onChange={() => {}} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lists games alphabetically so the control does not reorder itself', () => {
    render(<GameFilter meta={META} value={null} onChange={() => {}} />);
    const labels = screen.getAllByRole('button').map(b => b.textContent).filter(t => t !== 'All games');

    expect(labels).toEqual(['Conquest', 'Grid', 'Quiz']);
  });
});
