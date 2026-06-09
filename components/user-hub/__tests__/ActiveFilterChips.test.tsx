import type { UserListFilters } from '@/types/user-hub';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activeChipKeys, ActiveFilterChips } from '@/components/user-hub/ActiveFilterChips';

afterEach(cleanup);

describe('activeChipKeys', () => {
  it('returns only set facets (search/ordering/page are not chips)', () => {
    const filters: UserListFilters = {
      search: 'x',
      ordering: '-id',
      page: 2,
      is_online: 'true',
      favourite_game: 'grid',
    };

    expect(activeChipKeys(filters).sort()).toEqual(['favourite_game', 'is_online']);
  });

  it('is empty when no facets are set', () => {
    expect(activeChipKeys({ ordering: 'id', page: 1 })).toEqual([]);
  });
});

describe('ActiveFilterChips', () => {
  it('renders nothing when no facets are active', () => {
    const { container } = render(
      <ActiveFilterChips filters={{ ordering: 'id', page: 1 }} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a chip per active facet with readable labels', () => {
    render(
      <ActiveFilterChips
        filters={{ is_online: 'true', favourite_game: 'the-scout', suspension: 'any' }}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Favourited: The Scout')).toBeInTheDocument();
    expect(screen.getByText('Suspended (any)')).toBeInTheDocument();
  });

  it('fires onRemove with the facet key and onClearAll', async () => {
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    render(
      <ActiveFilterChips filters={{ is_online: 'true' }} onRemove={onRemove} onClearAll={onClearAll} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Remove Online filter/ }));

    expect(onRemove).toHaveBeenCalledWith('is_online');

    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onClearAll).toHaveBeenCalled();
  });
});
