'use client';

import type { DifficultyMatrixResponse } from '@/types/reports';
import { TileMatrix } from '@/components/analytics/panels/TileMatrix';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { difficultyTier as tier } from '@/lib/data-colours';
import { cn } from '@/lib/utils';

/**
 * Approved footballers by nation or team, split by difficulty.
 *
 * The same table as the question matrix, asking the same question of a
 * different row: is this one thin at the top end. Switching dimension refetches
 * rather than re-slicing, because the two are different queries — a nation row
 * counts each footballer once, a team row counts them per club.
 */
const DIMENSIONS = [
  { key: 'nation', label: 'By nation' },
  { key: 'team', label: 'By team' },
];

export function FootballerMatrix({ data, dimension, onDimensionChange, search, onSearchChange, difficulty, onDifficultyChange, onExpand, expanded }: {
  data: DifficultyMatrixResponse;
  dimension: string;
  onDimensionChange: (next: string) => void;
  search: string;
  onSearchChange: (next: string) => void;
  difficulty: string | null;
  onDifficultyChange: (next: string | null) => void;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  const { matrix, difficulty_order: order } = data;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{`Footballers by ${data.dimension} and difficulty`}</CardTitle>
          <CardDescription>
            {data.rows_double_count
              // Said outright, because the same footballer legitimately appears
              // in several rows here and the column will not add up.
              ? 'A footballer belongs to every club they played for, so these rows deliberately sum to more than the catalogue holds. Approved footballers only, which is why a squad here is smaller than on the teams page.'
              : 'A footballer has one nation, so these rows add up. Approved footballers only.'}
            {difficulty
              ? ` Ranked by ${tier(difficulty).label} — every tier is still shown beside it.`
              : ' Ranked by total.'}
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <div className="flex gap-1" role="group" aria-label="Group footballers by">
            {DIMENSIONS.map(option => (
              <button
                key={option.key}
                type="button"
                aria-pressed={dimension === option.key}
                onClick={() => onDimensionChange(option.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
                  dimension === option.key
                    ? 'bg-primary text-primary-foreground ring-transparent'
                    : 'text-muted-foreground ring-border hover:bg-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <SearchBox
            value={search}
            onChange={onSearchChange}
            label={`Filter ${data.dimension}s in this table`}
            placeholder={`Filter these ${data.dimension}s…`}
            className="w-full sm:w-56"
          />
          <div className="flex flex-wrap gap-1" role="group" aria-label="Rank by difficulty">
            {order.map((tierKey) => {
              const active = difficulty === tierKey;
              return (
                <button
                  key={tierKey}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onDifficultyChange(active ? null : tierKey)}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
                    active
                      ? cn('bg-gradient-to-br text-white ring-transparent', tier(tierKey).chip)
                      : 'text-muted-foreground ring-border hover:bg-muted',
                  )}
                >
                  {tier(tierKey).label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TileMatrix
          rows={matrix.items}
          order={order}
          rankedBy={difficulty}
          onRankBy={onDifficultyChange}
          rowHeading={data.dimension_label}
          total={matrix.total}
          shown={matrix.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel={search ? `No ${data.dimension} matches "${search}".` : `No ${data.dimension} has an approved footballer.`}
        />
      </CardContent>
    </Card>
  );
}
