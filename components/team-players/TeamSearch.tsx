'use client';

import { Hash, Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { TeamAPI } from '@/lib/team-api';
import type { TeamSearchResult } from '@/types/team';

type Props = {
  /** Called when the user picks a team — by autocomplete, Enter on a
   *  highlighted row, or by submitting the by-ID tab. */
  onSelect: (teamId: number) => void;
  /** Surface a validation error inline (e.g. invalid ID input). The
   *  parent owns the data-fetch error display. */
  onValidationError?: (message: string) => void;
};

const DROPDOWN_MIN_CHARS = 2;

export function TeamSearch({ onSelect, onValidationError }: Props) {
  const [searchName, setSearchName] = useState('');
  const debouncedName = useDebouncedValue(searchName, 250);
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [open, setOpen] = useState(false);

  const [idInput, setIdInput] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset the highlight whenever the result set changes — the previous
  // index is meaningless once results are different.
  useEffect(() => {
    setHighlight(results.length > 0 ? 0 : -1);
  }, [results]);

  // Keep the highlighted row scrolled into view on keyboard nav.
  // Guarded with a feature check — jsdom (test env) doesn't implement
  // ``scrollIntoView`` on HTMLElement.
  useEffect(() => {
    if (highlight < 0 || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(
      `[data-row-index="${highlight}"]`,
    );
    if (item && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight]);

  // Run the search whenever the debounced name changes.
  useEffect(() => {
    let cancelled = false;
    const query = debouncedName.trim();
    if (query.length < DROPDOWN_MIN_CHARS) {
      setResults([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    setOpen(true);
    TeamAPI.searchTeams(query)
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
  }, [debouncedName]);

  function pickTeam(teamId: number) {
    onSelect(teamId);
    setSearchName('');
    setResults([]);
    setOpen(false);
    setIdInput('');
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      // Even with no results, Esc should clear the field — feels right.
      if (e.key === 'Escape') {
        setSearchName('');
        setOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((i) => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case 'Enter':
        e.preventDefault();
        pickTeam(results[Math.max(0, highlight)].id);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  function submitId() {
    const parsed = Number(idInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      onValidationError?.('Enter a positive integer team ID.');
      return;
    }
    pickTeam(parsed);
  }

  const showDropdown = open && (loading || results.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-5 text-emerald-600" />
          Find a team
        </CardTitle>
        <CardDescription className="text-sm">
          Start typing the club name (case-insensitive, partial match). Use
          <kbd className="mx-1 rounded border bg-muted px-1 text-xs">↑</kbd>
          <kbd className="mx-1 rounded border bg-muted px-1 text-xs">↓</kbd>
          to navigate and
          <kbd className="mx-1 rounded border bg-muted px-1 text-xs">Enter</kbd>
          to pick. Or paste the team's numeric ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="name">
          <TabsList className="mb-3">
            <TabsTrigger value="name">
              <Search className="mr-1.5 size-3.5" /> By name
            </TabsTrigger>
            <TabsTrigger value="id">
              <Hash className="mr-1.5 size-3.5" /> By ID
            </TabsTrigger>
          </TabsList>

          {/* ---- By name ------------------------------------------------ */}
          <TabsContent value="name" className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={inputRef}
                role="combobox"
                aria-label="Search team by name"
                aria-autocomplete="list"
                aria-controls="team-search-results"
                aria-expanded={showDropdown}
                aria-activedescendant={
                  highlight >= 0 ? `team-search-row-${results[highlight]?.id}` : undefined
                }
                placeholder={`Type at least ${DROPDOWN_MIN_CHARS} characters…`}
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  // Delay so a click on a list item lands before we close.
                  setTimeout(() => setOpen(false), 120);
                }}
                onKeyDown={handleSearchKeyDown}
                className="h-11 pl-10 pr-10 text-base shadow-sm focus-visible:ring-emerald-500"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-emerald-500" />
              )}

              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {loading && results.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500">Searching…</p>
                  )}
                  {!loading && results.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500">No teams match that name.</p>
                  )}
                  {results.length > 0 && (
                    <ul
                      ref={listRef}
                      id="team-search-results"
                      role="listbox"
                      className="max-h-72 overflow-auto py-1"
                    >
                      {results.map((team, idx) => {
                        const active = idx === highlight;
                        return (
                          <li key={team.id} role="presentation">
                            <button
                              id={`team-search-row-${team.id}`}
                              data-row-index={idx}
                              type="button"
                              role="option"
                              aria-selected={active}
                              onMouseEnter={() => setHighlight(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => pickTeam(team.id)}
                              className={
                                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors '
                                + (active
                                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/50')
                              }
                            >
                              <span className="truncate font-medium">{team.name}</span>
                              <span className="shrink-0 text-xs text-gray-400">#{team.id}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---- By ID -------------------------------------------------- */}
          <TabsContent value="id" className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-label="Team ID"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="e.g. 42"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitId()}
                  className="h-11 pl-10 text-base shadow-sm focus-visible:ring-emerald-500"
                />
              </div>
              <Button
                onClick={submitId}
                disabled={!idInput.trim()}
                className="h-11 border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl sm:w-32"
              >
                <Search className="mr-2 size-4" />
                Load
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
