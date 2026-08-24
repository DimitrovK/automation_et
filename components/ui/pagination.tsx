import type { ButtonProps } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import * as React from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = ({ ref, className, ...props }: React.ComponentProps<'ul'> & { ref?: React.RefObject<HTMLUListElement | null> }) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = ({ ref, className, ...props }: React.ComponentProps<'li'> & { ref?: React.RefObject<HTMLLIElement | null> }) => (
  <li ref={ref} className={cn('', className)} {...props} />
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'>
& React.ComponentProps<'a'>;

const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      isActive
        ? 'border-emerald-500 bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:from-emerald-600 hover:to-green-700'
        : 'transition-all duration-200 hover:border-emerald-300 hover:bg-linear-to-r hover:from-emerald-100 hover:to-green-100 hover:text-emerald-700 dark:hover:border-emerald-600 dark:hover:from-emerald-800 dark:hover:to-green-800 dark:hover:text-emerald-200',
      className,
    )}
    {...props}
  >
    {children}
  </a>
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn(
      'gap-1 border-emerald-500 bg-linear-to-r from-emerald-500 to-green-600 pl-2.5 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl',
      className,
    )}
    {...props}
  >
    <ChevronLeft className="size-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn(
      'gap-1 border-emerald-500 bg-linear-to-r from-emerald-500 to-green-600 pr-2.5 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl',
      className,
    )}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="size-4" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex size-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
