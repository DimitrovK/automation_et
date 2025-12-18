'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';
import { cn } from '@/lib/utils';

const Progress = ({ ref, className, value, ...props }: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { ref?: React.RefObject<React.ElementRef<typeof ProgressPrimitive.Root> | null> }) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-gray-800', // graphite track
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="size-full flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
