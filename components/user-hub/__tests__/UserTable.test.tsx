import type { HubUser } from '@/types/user-hub';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserTable } from '@/components/user-hub/UserTable';

function user(overrides: Partial<HubUser> = {}): HubUser {
  return {
    id: 1,
    username: 'kalin',
    email: 'kalin@example.com',
    first_name: 'Kalin',
    last_name: 'D',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    favourite_games: ['grid', 'quiz'],
    suspension_scope: null,
    suspended_until: null,
    suspension_reason: null,
    beta_features: [],
    is_beta_tester: false,
    is_online: true,
    ...overrides,
  };
}

describe('UserTable', () => {
  afterEach(cleanup);

  it('shows an empty state when there are no users', () => {
    render(<UserTable users={[]} onSelect={vi.fn()} />);

    expect(screen.getByText(/No users match/)).toBeInTheDocument();
  });

  it('renders a row per user with username + favourites', () => {
    render(
      <UserTable
        users={[
          user(),
          user({ id: 2, username: 'admin', is_superuser: true, favourite_games: ['career-path'] }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('user-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-2')).toBeInTheDocument();
    expect(screen.getByText('kalin')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    // user 1's favourites + user 2's distinct favourite
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Career Path')).toBeInTheDocument();
  });

  it('shows a suspension badge for suspended users', () => {
    render(
      <UserTable
        users={[user({ suspension_scope: 'FULL_PLATFORM', suspension_reason: 'spam' })]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Full suspension')).toBeInTheDocument();
  });

  it('calls onSelect with the user when a row is clicked', async () => {
    const onSelect = vi.fn();
    const u = user({ id: 7, username: 'clicked' });
    render(<UserTable users={[u]} onSelect={onSelect} />);
    await userEvent.click(screen.getByTestId('user-row-7'));

    expect(onSelect).toHaveBeenCalledWith(u);
  });
});
