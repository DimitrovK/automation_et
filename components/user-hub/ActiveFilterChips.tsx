'use client';

import type { UserListFilters } from '@/types/user-hub';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prettySlug, suspensionLabel } from '@/lib/user-hub-format';

/**
 * Filter keys that render as removable chips (search has its own input; page
 *  and ordering are not facets). Exported so the page and tests agree on the set.
 */
export type ChipKey = 'is_online' | 'favourite_game' | 'has_favourites' | 'is_beta_tester' | 'suspension' | 'is_active';

/** Human label for an active filter value, or null if not set. */
export function chipLabel(key: ChipKey, filters: UserListFilters): string | null {
  switch (key) {
    case 'is_online':
      return filters.is_online === 'true' ? 'Online' : filters.is_online === 'false' ? 'Offline' : null;
    case 'favourite_game':
      return filters.favourite_game ? `Favourited: ${prettySlug(filters.favourite_game)}` : null;
    case 'has_favourites':
      return filters.has_favourites === 'true' ? 'Has favourites' : filters.has_favourites === 'false' ? 'No favourites' : null;
    case 'is_beta_tester':
      return filters.is_beta_tester === 'true' ? 'Beta testers' : filters.is_beta_tester === 'false' ? 'Non-beta' : null;
    case 'is_active':
      return filters.is_active === 'true' ? 'Active' : filters.is_active === 'false' ? 'Inactive' : null;
    case 'suspension':
      if (!filters.suspension) {
        return null;
      }
      if (filters.suspension === 'none') {
        return 'Not suspended';
      }
      if (filters.suspension === 'any') {
        return 'Suspended (any)';
      }
      return suspensionLabel(filters.suspension);
    default:
      return null;
  }
}

const CHIP_KEYS: ChipKey[] = ['is_online', 'favourite_game', 'has_favourites', 'is_beta_tester', 'suspension', 'is_active'];

/** Returns the active chip keys for the given filters (for the page + tests). */
export function activeChipKeys(filters: UserListFilters): ChipKey[] {
  return CHIP_KEYS.filter(k => chipLabel(k, filters) !== null);
}

type Props = {
  filters: UserListFilters;
  onRemove: (key: ChipKey) => void;
  onClearAll: () => void;
};

export function ActiveFilterChips({ filters, onRemove, onClearAll }: Props) {
  const active = activeChipKeys(filters);
  if (active.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map((key) => {
        const label = chipLabel(key, filters);
        return (
          <Badge key={key} variant="secondary" className="gap-1 pr-1">
            {label}
            <button
              type="button"
              aria-label={`Remove ${label} filter`}
              onClick={() => onRemove(key)}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      })}
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
