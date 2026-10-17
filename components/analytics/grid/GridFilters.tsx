'use client';

import type { GridPlayType } from '@/hooks/use-report-filters';
import { FilterGroup } from '@/components/reports/filters/FilterBar';
import { Segmented } from '@/components/reports/primitives/PanelCard';

export type BoardOption = { key: string; label: string; sessions: number };

export type GridPopulationFilters = {
  playType: GridPlayType;
  board: string | null;
  variationMode: string | null;
  reveal: string | null;
};

const PLAY_TYPES: readonly { value: GridPlayType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'solo', label: 'Solo' },
  { value: 'multiplayer', label: 'Multiplayer' },
];

const ANY = 'any';

const VARIATION_MODES: readonly { value: string; label: string }[] = [
  { value: ANY, label: 'Both' },
  { value: 'HOME', label: 'Classic' },
  { value: 'ABROAD', label: 'Reversed' },
];

const REVEALS: readonly { value: string; label: string }[] = [
  { value: ANY, label: 'Both' },
  { value: 'INSTANT', label: 'Instant' },
  { value: 'FINAL', label: 'Final Whistle' },
];

/**
 * Who the whole Grid page is about. Every card below follows these, so the
 * numbers on one page always describe the same sessions.
 *
 * Boards come from the window's own sessions (biggest first), so the list
 * names what was actually played rather than every variation ever made.
 */
export function GridFilters({ value, onChange, boards, modeLabels, revealLabels }: {
  value: GridPopulationFilters;
  onChange: (patch: Partial<GridPopulationFilters>) => void;
  boards: BoardOption[];
  /** Grid settings' names for HOME / ABROAD and INSTANT / FINAL. */
  modeLabels: Record<string, string>;
  revealLabels: Record<string, string>;
}) {
  const countryBoard = value.board !== null && value.board !== 'global';
  const selectedMissing = countryBoard && !boards.some(b => b.key === value.board);

  return (
    <>
      <FilterGroup label="Play type">
        <Segmented
          label="Play type"
          value={value.playType}
          options={PLAY_TYPES}
          onChange={playType => onChange({ playType })}
        />
      </FilterGroup>

      <FilterGroup label="Board" hint="Global is the standard grid; the others are country boards. Counts are all play in the date range.">
        <select
          aria-label="Board"
          value={value.board ?? ''}
          onChange={event => onChange({ board: event.target.value || null, ...(event.target.value === 'global' ? { variationMode: null } : {}) })}
          className="h-7 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">All boards</option>
          {!boards.some(b => b.key === 'global') && <option value="global">Global</option>}
          {boards.map(board => (
            <option key={board.key} value={board.key}>
              {`${board.label} · ${board.sessions.toLocaleString()}`}
            </option>
          ))}
          {selectedMissing && <option value={value.board!}>{`Board #${value.board}`}</option>}
        </select>
      </FilterGroup>

      {value.board !== 'global' && (
        <FilterGroup label="Country mode" hint="Only country boards have a mode.">
          <Segmented
            label="Country mode"
            value={value.variationMode ?? ANY}
            options={VARIATION_MODES.map(option => ({ ...option, label: modeLabels[option.value] ?? option.label }))}
            onChange={mode => onChange({ variationMode: mode === ANY ? null : mode })}
          />
        </FilterGroup>
      )}

      <FilterGroup label="Timing">
        <Segmented
          label="Timing"
          value={value.reveal ?? ANY}
          options={REVEALS.map(option => ({ ...option, label: revealLabels[option.value] ?? option.label }))}
          onChange={reveal => onChange({ reveal: reveal === ANY ? null : reveal })}
        />
      </FilterGroup>
    </>
  );
}
