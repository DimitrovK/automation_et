'use client';

import type { HubUser } from '@/types/user-hub';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initialsFor, prettySlug, suspensionLabel } from '@/lib/user-hub-format';
import { cn } from '@/lib/utils';

/** Profile-picture avatar with initials fallback. */
export function UserAvatar({ user, className }: { user: HubUser; className?: string }) {
  return (
    <Avatar className={cn('size-8', className)}>
      {user.profile_picture_url && <AvatarImage src={user.profile_picture_url} alt={user.username} />}
      <AvatarFallback className="text-xs">{initialsFor(user)}</AvatarFallback>
    </Avatar>
  );
}

/** Renders the suspension state, or null when the user is in good standing. */
export function SuspensionBadge({ user }: { user: HubUser }) {
  if (!user.suspension_scope) {
    return null;
  }
  return (
    <Badge variant="destructive" title={user.suspension_reason ?? undefined}>
      {suspensionLabel(user.suspension_scope)}
    </Badge>
  );
}

/** Beta-tester / per-feature badges. Shows up to `max` feature chips. */
export function BetaBadges({ user, max = 3 }: { user: HubUser; max?: number }) {
  if (!user.is_beta_tester && (!user.beta_features || user.beta_features.length === 0)) {
    return null;
  }
  const features = user.beta_features ?? [];
  const shown = features.slice(0, max);
  const extra = features.length - shown.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100">
        beta
      </Badge>
      {shown.map(f => (
        <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
      ))}
      {extra > 0 && (
        <span className="text-xs text-gray-500">
          +
          {extra}
        </span>
      )}
    </span>
  );
}

/** Favourite-game chips (slugs prettified), capped with a +N overflow. */
export function FavouriteGamesBadges({ games, max = 3 }: { games: string[]; max?: number }) {
  if (!games || games.length === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const shown = games.slice(0, max);
  const extra = games.length - shown.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map(g => (
        <Badge key={g} variant="outline" className="text-xs">{prettySlug(g)}</Badge>
      ))}
      {extra > 0 && (
        <span className="text-xs text-gray-500">
          +
          {extra}
        </span>
      )}
    </span>
  );
}

/** Presence dot. `is_online` may be undefined (Redis unavailable) → "unknown". */
export function OnlineDot({ user }: { user: HubUser }) {
  const state = user.is_online === undefined ? 'unknown' : user.is_online ? 'online' : 'offline';
  const color
    = state === 'online' ? 'bg-emerald-500' : state === 'offline' ? 'bg-gray-300 dark:bg-gray-600' : 'bg-amber-400';
  return (
    <span className="inline-flex items-center gap-1.5" title={state}>
      <span className={cn('size-2 rounded-full', color)} />
      <span className="text-xs capitalize text-gray-500">{state}</span>
    </span>
  );
}
