import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SurfaceTabs } from '@/components/admin/SurfaceTabs';

describe('SurfaceTabs', () => {
  it('links the two surfaces of a game that has both', () => {
    render(<SurfaceTabs gameKey="career_path" active="content" />);

    expect(screen.getByRole('tab', { name: 'Behaviour' })).toHaveAttribute('href', '/reports/games/career_path');
    expect(screen.getByRole('tab', { name: 'Content' })).toHaveAttribute('href', '/analytics/career-path');
    expect(screen.getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Behaviour' })).toHaveAttribute('aria-selected', 'false');
  });

  it('renders nothing for a game without a content page', () => {
    const { container } = render(<SurfaceTabs gameKey="quiz" active="behaviour" />);

    expect(container).toBeEmptyDOMElement();
  });
});
