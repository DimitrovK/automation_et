'use client';

import type { HubUser } from '@/types/user-hub';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BetaBadges, FavouriteGamesBadges, OnlineDot, SuspensionBadge, UserAvatar } from './user-badges';

type Props = {
  users: HubUser[];
  onSelect: (user: HubUser) => void;
};

/** Dense admin table of users. Row click opens the detail sheet. */
export function UserTable({ users, onSelect }: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-gray-500">
        No users match your filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-right font-mono text-xs">ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Favourites</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Presence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow
              key={u.id}
              data-testid={`user-row-${u.id}`}
              role="button"
              tabIndex={0}
              aria-label={`Open ${u.username}`}
              onClick={() => onSelect(u)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(u);
                }
              }}
              className="cursor-pointer"
            >
              <TableCell className="text-right font-mono text-xs text-gray-500">
                #
                {u.id}
              </TableCell>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  <UserAvatar user={u} className="size-7" />
                  <span>
                    {u.username}
                    {u.is_superuser
                      ? <span className="ml-2 text-xs text-amber-600" title="Superuser">★</span>
                      : u.is_staff
                        ? <span className="ml-2 text-xs text-emerald-600" title="Staff">◆</span>
                        : null}
                    {!u.is_active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                  </span>
                </span>
              </TableCell>
              <TableCell className="hidden text-sm text-gray-600 dark:text-gray-300 md:table-cell">
                {u.email || '—'}
              </TableCell>
              <TableCell><FavouriteGamesBadges games={u.favourite_games} /></TableCell>
              <TableCell>
                <span className="inline-flex flex-wrap items-center gap-1">
                  <SuspensionBadge user={u} />
                  <BetaBadges user={u} max={1} />
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell"><OnlineDot user={u} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
