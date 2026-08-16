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

export function CategoryMatrix({ data, onExpand, expanded, search, onSearchChange }: {
  data: QuestionBankResponse;
  onExpand?: () => void;
  expanded?: boolean;
  search: string;
  onSearchChange: (next: string) => void;
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
          </CardDescription>
        </div>
        {/* ON the card it filters, not in the page filter bar. Up there it sat
            beside the date range with nothing to say which panel it applied to
            — and it applies to this table alone. */}
        <SearchBox
          value={search}
          onChange={onSearchChange}
          label="Filter categories in this table"
          placeholder="Filter these categories…"
          className="w-full shrink-0 sm:w-56"
        />
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
            <table className="w-full min-w-[38rem] border-separate border-spacing-x-1 border-spacing-y-1.5 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card py-1 pr-3 text-left text-xs font-medium text-muted-foreground">
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
                  <th className="py-1 pl-4 text-right text-xs font-medium text-muted-foreground">Total</th>
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
                    <td className="py-1 pl-4">
                      {/* The row total gets the same weight as a cell so the
                          band reads as "these four, and what they come to"
                          rather than trailing off into plain text. */}
                      {/* The total is the one figure here that is not a
                          difficulty, so it stays neutral — and reads as the sum
                          rather than as a fifth tier. */}
                      <span className="block rounded-lg bg-muted/70 px-3 py-2 text-center text-sm font-bold tabular-nums text-foreground ring-1 ring-inset ring-border">
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
  // gaps are the reason to read this table — so it keeps its shape in the row
  // while clearly holding nothing.
  if (count === 0) {
    return (
      <td className="p-0">
        <span
          data-difficulty={difficulty}
          data-empty="true"
          className="block rounded-lg border border-dashed border-border/70 px-3 py-2 text-center text-sm text-muted-foreground/40"
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
          'block rounded-lg px-3 py-2 text-center text-sm font-semibold tabular-nums',
          'animate-data-rise transition-transform duration-150 hover:scale-[1.04]',
          style.chip,
        )}
        // Staggered across the row so a refetched table fills left to right
        // rather than flashing all at once.
        style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
      >
        {count.toLocaleString()}
      </span>
    </td>
  );
}
