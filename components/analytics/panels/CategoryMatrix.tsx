'use client';

import type { QuestionBankResponse } from '@/types/reports';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { ReportTable } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Questions per category, split by difficulty.
 *
 * A matrix rather than four stacked lists: the question is "is this category
 * thin at the top end", and that is a comparison ACROSS a row. Four separate
 * charts would put the four numbers you need to compare in four places.
 *
 * Cells are shaded by their share of the row, so a row reads as a shape before
 * it reads as numbers — a category with 400 HARD and 12 EASY looks different
 * from one that is flat, without anyone doing arithmetic. Shading is per row,
 * not global: England has ten times the questions of a small category, and a
 * global scale would render every small category as one flat colour.
 */
export function CategoryMatrix({ data, onExpand, expanded }: {
  data: QuestionBankResponse;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  const { category_matrix: matrix, difficulty_order: order } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions by category and difficulty</CardTitle>
        <CardDescription>
          {/* Said here rather than discovered later: this is the one figure on
              the page that does not add up, and for a good reason. */}
          A question can carry several categories, so these rows deliberately sum to more
          than the bank holds. Each cell is "questions carrying this category", never a
          share of the total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CappedList
          total={matrix.total}
          shown={matrix.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel={data.search ? `No category matches "${data.search}".` : 'No categories carry an approved question.'}
        >
          {/* Its own scroller: the matrix is wider than a phone and the page
              body must never scroll sideways. */}
          <div className="overflow-x-auto">
            <ReportTable>
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">Category</th>
                  {order.map(difficulty => (
                    <th key={difficulty} className="py-2 pr-4 text-right text-xs font-medium text-muted-foreground">
                      {difficulty[0]}
                      {difficulty.slice(1).toLowerCase()}
                    </th>
                  ))}
                  <th className="py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.items.map(row => (
                  <tr key={row.slug} className="border-b last:border-0">
                    <td className="py-1.5 pr-4 text-sm text-foreground">{row.category}</td>
                    {row.by_difficulty.map((count, index) => (
                      <Cell
                        key={order[index]}
                        count={count}
                        share={row.total ? count / row.total : 0}
                      />
                    ))}
                    <td className="py-1.5 text-right text-sm font-medium tabular-nums text-foreground">
                      {row.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ReportTable>
          </div>
        </CappedList>
      </CardContent>
    </Card>
  );
}

function Cell({ count, share }: { count: number; share: number }) {
  return (
    <td className="py-1.5 pr-4 text-right">
      <span
        className={cn(
          'inline-block min-w-[2.5rem] rounded px-1.5 py-0.5 text-sm tabular-nums',
          // Zero gets no shading at all: an empty cell is the thing you are
          // looking for, and tinting it the lightest shade of "some" hides it.
          count === 0 ? 'text-muted-foreground/60' : 'text-foreground',
        )}
        style={count === 0 ? undefined : { backgroundColor: `color-mix(in oklab, var(--color-primary) ${Math.round(share * 55)}%, transparent)` }}
      >
        {count.toLocaleString()}
      </span>
    </td>
  );
}
