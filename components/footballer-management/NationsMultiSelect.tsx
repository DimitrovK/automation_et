'use client';

import { X } from 'lucide-react';
import { useMemo } from 'react';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { Badge } from '@/components/ui/badge';
import type { FootballerNation } from '@/types/player';

type Props = {
  /** Currently-selected nations. The order is preserved. */
  value: FootballerNation[];
  onChange: (nations: FootballerNation[]) => void;
  /** Optional: don't allow this id (e.g. the primary nation) to also be
   *  in the secondary list — they're a different concept. */
  excludeIds?: number[];
  disabled?: boolean;
};

/**
 * Chip-style multi-select for ``other_nations`` (dual citizenship).
 *
 * Renders each selected nation as a removable Badge, with a single
 * Combobox below to add a new one. Mirrors the ``NationCombobox`` UX
 * — same searchable list, just filtered to nations not already
 * picked.
 */
export function NationsMultiSelect({ value, onChange, excludeIds = [], disabled }: Props) {
  const selectedIds = useMemo(() => value.map((n) => n.id), [value]);
  const allExcluded = useMemo(
    () => Array.from(new Set([...selectedIds, ...excludeIds])),
    [selectedIds, excludeIds],
  );

  function add(_id: number, nation: FootballerNation) {
    if (selectedIds.includes(nation.id)) return;
    onChange([...value, nation]);
  }

  function remove(id: number) {
    onChange(value.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 ? (
          <p className="text-xs text-gray-500">No secondary nationalities — leave empty for single-citizenship players.</p>
        ) : (
          value.map((n) => (
            <Badge
              key={n.id}
              variant="secondary"
              className="gap-1 pl-2 pr-1 text-sm"
            >
              <span>{n.name}</span>
              <span className="text-xs text-gray-500">({n.short})</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  aria-label={`Remove ${n.name}`}
                  className="ml-1 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      {!disabled && (
        <NationCombobox
          value={null}
          onChange={add}
          excludeIds={allExcluded}
          placeholder="Add a secondary nationality…"
          compact
        />
      )}
    </div>
  );
}
