import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SurfaceTabs } from '@/components/admin/SurfaceTabs';

describe('SurfaceTabs', () => {
  it('links the two surfaces of a game that has both', () => {
    render(<SurfaceTabs gameKey="grid" active="content" />);

    expect(screen.getByRole('tab', { name: 'Behaviour' })).toHaveAttribute('href', '/reports/games/grid');
    expect(screen.getByRole('tab', { name: 'Content' })).toHaveAttribute('href', '/analytics/grid');
    expect(screen.getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Behaviour' })).toHaveAttribute('aria-selected', 'false');
  });

  it('renders nothing for a game without a content page', () => {
    const { container } = render(<SurfaceTabs gameKey="quiz" active="behaviour" />);

    expect(container).toBeEmptyDOMElement();
  });
});
