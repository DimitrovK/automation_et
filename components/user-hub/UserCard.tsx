'use client';

import type { HubUser } from '@/types/user-hub';
import { Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BetaBadges, FavouriteGamesBadges, OnlineDot, SuspensionBadge } from './user-badges';

type Props = {
  user: HubUser;
  onSelect: (user: HubUser) => void;
};

/** Card view of a user (mobile / cards toggle). Click opens the detail sheet. */
export function UserCard({ user, onSelect }: Props) {
  return (
    <Card
      onClick={() => onSelect(user)}
      className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="truncate">
            {user.username}
            {user.is_superuser
              ? <span className="ml-2 text-xs text-amber-600" title="Superuser">★</span>
              : user.is_staff
                ? <span className="ml-2 text-xs text-emerald-600" title="Staff">◆</span>
                : null}
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
