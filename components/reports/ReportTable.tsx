import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The reporting surface's one table.
 *
 * Eight tables across seven files each spelled out their own padding, and had
 * already produced four header-cell treatments for what is meant to be one
 * thing: `py-2 pr-4 font-medium`, the right-aligned variant, a version with no
 * right padding for the last column, and a one-off. The differences are small
 * enough that nobody sees them side by side and large enough that columns do not
 * line up between two reports showing the same shape of data.
 *
 * Alignment is a prop rather than a class, because it is a property of the DATA:
 * numbers right, labels left, always, so a reader's eye lands in the same place
 * in every table. Passing it as a className made it a per-table decision, which
 * is how three of them ended up disagreeing.
 */
export function ReportTable({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn('w-full text-sm', className)}>{children}</table>;
}

/** Header row. Recessive: a column name is a label, not content. */
export function ReportHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b text-left text-muted-foreground">{children}</tr>
    </thead>
  );
}

/**
 * `last:pr-0` rather than a separate no-padding variant for the final column:
 * the old markup made that a manual choice per table, so a table that gained a
 * column later kept a stray gap on the right of its last one.
 */
const CELL = 'py-2 pr-4 last:pr-0';

/**
 * `center` exists for one case: the cohort grid, where a cell is a coloured
 * block rather than a figure, so there is no digit column for the eye to follow.
 * Numbers stay right-aligned everywhere else.
 */
type Align = 'left' | 'right' | 'center';

const ALIGN: Record<Align, string | undefined> = {
  left: undefined,
  right: 'text-right',
  center: 'text-center',
};

export function Th({ children, align = 'left', className, title }: {
  children?: ReactNode;
  align?: Align;
  className?: string;
  /** Hover explanation for a column whose name is too short to be self-evident. */
  title?: string;
}) {
  return (
    <th className={cn(CELL, 'font-medium', ALIGN[align], className)} title={title}>
      {children}
    </th>
  );
}

/**
 * A data row. The hover tint is the only addition to what these tables had: it
 * is how you keep your place reading across eleven columns, and none of these
 * rows are clickable, so it cannot be mistaken for an affordance.
 */
export function ReportRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('border-b last:border-0 hover:bg-muted/40', className)}>{children}</tr>;
}

export function Td({ children, align = 'left', strong, className }: {
  children?: ReactNode;
  align?: Align;
  /** The row's subject — the game or player the other cells are about. */
  strong?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        CELL,
        ALIGN[align],
        strong && 'font-medium text-foreground',
        className,
      )}
    >
      {children}
    </td>
  );
}
