import * as React from 'react';

import { cn } from '@/lib/utils';

const Card = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className,
    )}
    {...props}
  />
);
Card.displayName = 'Card';

const CardHeader = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-5', className)}
    {...props}
  />
);
CardHeader.displayName = 'CardHeader';

/**
 * `text-base`, not the stock `text-2xl`.
 *
 * A card title introduces the content of one panel; at 24px it was the same
 * size as the figure inside it, so the label was exactly as loud as the number
 * it was labelling. On a page with eight panels that is eight headings set at
 * page-title size, which flattens the hierarchy and is most of why the surface
 * read as heavy.
 *
 * The figure stays 24px, the title drops to 16px, and the description below it
 * stays 14px — so a panel reads number first, then what it is, then the caveat.
 */
const CardTitle = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    // Marks the title slot so `OnThisPage` can build a jump list from cards on
    // pages that have no section headings. A class-based selector would break
    // the first time this component is restyled.
    data-card-title=""
    className={cn(
      'text-base font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
);
CardTitle.displayName = 'CardTitle';

const CardDescription = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);
CardDescription.displayName = 'CardDescription';

const CardContent = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    className={cn('flex items-center p-5 pt-0', className)}
    {...props}
  />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
