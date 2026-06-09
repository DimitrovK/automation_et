'use client';

import type { HubUser } from '@/types/user-hub';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BetaBadges, FavouriteGamesBadges, OnlineDot, SuspensionBadge, UserAvatar } from './user-badges';

type Props = {
  user: HubUser;
  onSelect: (user: HubUser) => void;
};

/** Card view of a user (mobile / cards toggle). Click opens the detail sheet. */
export function UserCard({ user, onSelect }: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open ${user.username}`}
      onClick={() => onSelect(user)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(user);
        }
      }}
      className="cursor-pointer transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2 truncate">
            <UserAvatar user={user} />
            <span className="truncate">
              {user.username}
              {user.is_superuser
                ? <span className="ml-2 text-xs text-amber-600" title="Superuser">★</span>
                : user.is_staff
                  ? <span className="ml-2 text-xs text-emerald-600" title="Staff">◆</span>
                  : null}
            </span>
          </span>
          <span className="font-mono text-xs text-gray-400">
            #
            {user.id}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="flex items-center gap-1.5 truncate text-sm text-gray-600 dark:text-gray-300">
          <Mail className="size-3.5 shrink-0" />
          {user.email || '—'}
        </p>
        <div><FavouriteGamesBadges games={user.favourite_games} /></div>
        <div className="flex flex-wrap items-center gap-1">
          <SuspensionBadge user={user} />
          <BetaBadges user={user} max={2} />
          {!user.is_active && <span className="text-xs text-gray-400">inactive</span>}
        </div>
        <OnlineDot user={user} />
      </CardContent>
    </Card>
  );
}
