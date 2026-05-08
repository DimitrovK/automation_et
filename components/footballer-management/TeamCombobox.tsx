'use client';

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { TeamAPI } from '@/lib/team-api';
import { cn } from '@/lib/utils';
import type { TeamSearchResult } from '@/types/team';

type Props = {
  value: { id: number; name: string } | null;
  onChange: (team: { id: number; name: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
};

/**
 * Searchable team picker for the TeamsEditor. Hits the public
 * ``/data/team/search/`` endpoint as the user types — same pattern as
 * the Team Players landing search, but inline in a popover.
 */
export function TeamCombobox({
  value,
  onChange,
  placeholder = 'Search a team…',
  disabled,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    TeamAPI.searchTeams(q)
      .then((res) => {
        if (!cancelled) setResults(res);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

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
            !value && 'text-muted-foreground',
          )}
        >
          {value ? (
            <span className="truncate">{value.name}</span>
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
            placeholder="Type at least 2 characters…"
          />
          <CommandList>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
                <Loader2 className="size-4 animate-spin" /> Searching…
              </div>
            )}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <CommandEmpty>No teams match that name.</CommandEmpty>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup>
                {results.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`${t.name}-${t.id}`}
                    onSelect={() => {
                      onChange({ id: t.id, name: t.name });
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        value?.id === t.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex-1 truncate">{t.name}</span>
                    <span className="ml-2 text-xs text-gray-400">#{t.id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
