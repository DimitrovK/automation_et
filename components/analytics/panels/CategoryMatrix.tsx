'use client';

import type { QuestionBankResponse } from '@/types/reports';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { CappedList } from '@/components/reports/primitives/CappedList';
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
          <CardTitle>Questions by category and difficulty</CardTitle>
          <CardDescription>
            {/* Said here rather than discovered later: this is the one figure on
                the page that does not add up, and for a good reason. */}
            A question can carry several categories, so these rows deliberately sum to more
            than the bank holds. Each cell is "questions carrying this category", never a
            share of the total.
            {difficulty
              ? ` Ranked by ${tier(difficulty).label} questions — every tier is still shown beside it.`
              : ' Ranked by total questions.'}
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
        <CappedList
          total={matrix.total}
          shown={matrix.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel={search ? `No category matches "${search}".` : 'No categories carry an approved question.'}
        >
          {/* Its own scroller: the matrix is wider than a phone and the page
              body must never scroll sideways. */}
          <div className="-mx-2 overflow-x-auto px-2">
            {/* A hair of space between cells — 4px. Welded edge to edge they
                read as one solid block and the eye has to hunt for the
                boundaries; fully separated they float. This is enough to make
                each a box without breaking the row into four. */}
            <table className="w-full min-w-[42rem] table-fixed border-separate border-spacing-x-1 border-spacing-y-1.5 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-52 bg-card py-1 pr-3 text-left text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  {order.map(difficulty => (
                    <th key={difficulty} className="pb-1.5 text-center">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', tier(difficulty).head)}>
                        {/* The dot carries the colour into the header, so a
                            column and its cells are visibly the same thing. */}
                        <span aria-hidden className={cn('size-1.5 rounded-full', tier(difficulty).dot)} />
                        {tier(difficulty).label}
                      </span>
                    </th>
                  ))}
                  <th className="pb-1.5 pl-2 text-center text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.items.map(row => (
                  <tr key={row.slug} className="group">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 max-w-48 truncate bg-card py-1 pr-3 text-left font-medium text-foreground transition-colors group-hover:bg-muted/40"
                      title={row.category}
                    >
                      {row.category}
                    </th>
                    {row.by_difficulty.map((count, index) => (
                      <Cell
                        key={order[index]}
                        difficulty={order[index]}
                        count={count}
                        index={index}
                      />
                    ))}
                    <td className="p-0 pl-2">
                      {/* The row total gets the same weight as a cell so the
                          band reads as "these four, and what they come to"
                          rather than trailing off into plain text. */}
                      {/* The total is the one figure here that is not a
                          difficulty, so it stays neutral — and reads as the sum
                          rather than as a fifth tier. */}
                      {/* Same height and shape as a difficulty cell so the row
                          reads as one set of tiles, and centred like them —
                          right-aligned it drifted away from the band. */}
                      <span className="flex h-14 items-center justify-center rounded-lg bg-muted/70 text-sm font-bold tabular-nums text-foreground ring-1 ring-inset ring-border">
                        {row.total.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CappedList>
      </CardContent>
    </Card>
  );
}

function Cell({ difficulty, count, index }: {
  difficulty: string;
  count: number;
  index: number;
}) {
  const style = tier(difficulty);

  // A dash, not a zero. An empty cell is the thing you are looking for, and the
  // gaps are the reason to read this table — so it keeps the tile's shape while
  // clearly holding nothing.
  if (count === 0) {
    return (
      <td className="p-0">
        <span
          data-difficulty={difficulty}
          data-empty="true"
          className="flex h-14 items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground/40"
        >
          —
        </span>
      </td>
    );
  }

  return (
    <td className="p-0">
      <span
        data-difficulty={difficulty}
        className={cn(
          // h-14 against a ~4.5rem column: near enough to square that the row
          // reads as tiles rather than as a bar chart lying on its side.
          'flex h-14 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold tabular-nums shadow-sm',
          'animate-data-rise transition-transform duration-150 hover:scale-[1.04]',
          // Alternating direction: dark-to-colour, then colour-to-dark. Two
          // neighbours meet light against dark instead of repeating, so the
          // seam is legible without a border between them.
          index % 2 === 0 ? style.chip : style.chipAlt,
        )}
        style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
      >
        {count.toLocaleString()}
      </span>
    </td>
  );
}
