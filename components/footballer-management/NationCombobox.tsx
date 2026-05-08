'use client';

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { FootballerAPI } from '@/lib/footballer-api';
import { cn } from '@/lib/utils';
import type { FootballerNation } from '@/types/player';

type Props = {
  value: number | null;
  onChange: (nationId: number, nation: FootballerNation) => void;
  placeholder?: string;
  /** Render a smaller trigger — used inside dense table rows. */
  compact?: boolean;
  disabled?: boolean;
  /** Hide nations that are already selected elsewhere (used by the
   *  multi-select to avoid offering duplicates). */
  excludeIds?: number[];
};

/**
 * Searchable single-select for Nation.
 *
 * Loads the full nation list once on first open and filters client-side
 * — there are <300 nations and `/data/nations/` is not paginated, so a
 * round trip per keystroke would be wasteful.
 */
export function NationCombobox({
  value,
  onChange,
  placeholder = 'Pick a nation…',
  compact = false,
  disabled = false,
  excludeIds = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [nations, setNations] = useState<FootballerNation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 100);

  // Fetch once on first open.
  useEffect(() => {
    if (!open || nations !== null || loading) return;
    setLoading(true);
    setError(null);
    FootballerAPI.getNations()
      .then((res) => {
        // API returns FootballerNation[] (id, name, nationality, short).
        const sorted = [...res].sort((a, b) => a.name.localeCompare(b.name));
        setNations(sorted);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load nations');
      })
      .finally(() => setLoading(false));
  }, [open, nations, loading]);

  const selected = useMemo(
    () => (nations || []).find((n) => n.id === value) || null,
    [nations, value],
  );

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const excludeSet = new Set(excludeIds);
    return (nations || []).filter((n) => {
      if (excludeSet.has(n.id)) return false;
      if (!q) return true;
      return (
        n.name.toLowerCase().includes(q)
        || n.nationality.toLowerCase().includes(q)
        || n.short.toLowerCase().includes(q)
      );
    });
  }, [nations, debouncedQuery, excludeIds]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            compact ? 'h-9 px-2 text-sm' : 'h-11',
            !selected && 'text-muted-foreground',
          )}
        >
          {selected ? (
            <span className="truncate">
              {selected.name}
              <span className="ml-1 text-xs text-gray-400">({selected.short})</span>
            </span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search nation, nationality, or short code…"
          />
          <CommandList>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
                <Loader2 className="size-4 animate-spin" />
                Loading nations…
              </div>
            )}
            {error && (
              <div className="px-3 py-4 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && (
              <>
                <CommandEmpty>No matching nation.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((n) => (
                    <CommandItem
                      key={n.id}
                      value={`${n.name}-${n.short}-${n.id}`}
                      onSelect={() => {
                        onChange(n.id, n);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          n.id === value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex-1 truncate">{n.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{n.short}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
