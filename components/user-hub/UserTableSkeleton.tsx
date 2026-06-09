'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { USER_LIST_PAGE_SIZE } from '@/hooks/use-user-list';

/** Placeholder rows matching the user table layout (avoids layout shift). */
export function UserTableSkeleton() {
  return (
    <div className="rounded-md border">
      {Array.from({ length: USER_LIST_PAGE_SIZE }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="flex items-center gap-3 border-b p-3 last:border-b-0">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-4 w-40 md:block" />
          <Skeleton className="ml-auto h-5 w-24" />
        </div>
      ))}
    </div>
  );
}
