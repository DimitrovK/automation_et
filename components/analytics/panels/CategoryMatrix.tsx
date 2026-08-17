'use client';

import type { QuestionBankResponse } from '@/types/reports';
import { TileMatrix } from '@/components/analytics/panels/TileMatrix';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { InfoHint } from '@/components/reports/primitives/InfoHint';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { difficultyTier as tier } from '@/lib/data-colours';
import { cn } from '@/lib/utils';

/**
 * Questions per category, split by difficulty.
 *
 * A matrix rather than four stacked lists: the question is "is this category
 * thin at the top end", and that is a comparison ACROSS a row. Four separate
 * charts would put the four numbers you need to compare in four places.
 *
 * Difficulty is ORDINAL, so it gets a heat ramp — cool for easy, hot for
 * extreme — rather than four unrelated hues. Four categorical colours would say
 * these are four different kinds of thing; they are four points on one scale,
 * and the ramp lets a row be read as a shape before it is read as numbers.
 *
 * Intensity within a cell is its share of the ROW, not of the table. England
 * has ten times the questions of a small category, and a global scale would
 * render every small category as one flat colour — which is exactly the row you
 * most need to see the shape of.
 */

export function CategoryMatrix({ data, onExpand, expanded, search, onSearchChange, difficulty, onDifficultyChange }: {
  data: QuestionBankResponse;
  onExpand?: () => void;
  expanded?: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  /** Rank by one tier, or null for overall size. */
  difficulty: string | null;
  onDifficultyChange: (next: string | null) => void;
}) {
  const { category_matrix: matrix, difficulty_order: order } = data;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            Questions by category and difficulty
            <InfoHint label="questions by category and difficulty">
              {/* Said here rather than discovered later: this is the one figure on
                the page that does not add up, and for a good reason. */}
              A question can carry several categories, so these rows deliberately sum to more
              than the bank holds. Each cell is "questions carrying this category", never a
              share of the total.
            </InfoHint>
          </CardTitle>
          {/* The ranking stays visible rather than hiding in the hint: it
              changes what you are looking at, so it is state, not a footnote. */}
          <CardDescription>
            {difficulty
              ? `Ranked by ${tier(difficulty).label} questions — every tier is still shown beside it.`
              : 'Ranked by total questions.'}
          </CardDescription>
        </div>
        {/* ON the card it filters, not in the page filter bar. Up there it sat
            beside the date range with nothing to say which panel it applied to
            — and it applies to this table alone. */}
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <SearchBox
            value={search}
            onChange={onSearchChange}
            label="Filter categories in this table"
            placeholder="Filter these categories…"
            className="w-full sm:w-56"
          />
          {/* Ranking, not column-hiding. "Which categories are thin at the top
              end" is answered by re-ordering the list, not by removing three
              columns — the other tiers are the context that makes the answer
              mean anything. */}
          <div className="flex flex-wrap gap-1" role="group" aria-label="Rank categories by difficulty">
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
          rows={matrix.items.map(row => ({
            key: row.slug,
            name: row.category,
            total: row.total,
            by_difficulty: row.by_difficulty,
            extra: row.added ?? null,
          }))}
          order={order}
          rankedBy={difficulty}
          rowHeading="Category"
          total={matrix.total}
          shown={matrix.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel={search ? `No category matches "${search}".` : 'No categories carry an approved question.'}
          extraHeading="Added"
          extraLabel={row => `${row.name}: ${row.extra ?? 0} added in this window`}
        />
      </CardContent>
    </Card>
  );
}
