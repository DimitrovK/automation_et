'use client';

import Link from 'next/link';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlossary } from '@/hooks/use-glossary';
import { useAuth } from '@/lib/auth';

/**
 * The same definitions the inline info popovers show, in one place.
 *
 * Deliberately not the primary surface — a number is best explained where it
 * appears. This exists for reading end to end before trusting a report, and as
 * something to point at in a conversation.
 */
export default function GlossaryPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const { metrics, byKey, isLoading, failed } = useGlossary(enabled);

  return (
    <ReportsShell
      title="What the numbers mean"
      description="Every metric: what it counts, what it leaves out, and how it can be misread."
    >
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Bot and simulation accounts are excluded everywhere by default. Anonymous
        players are real people and are always counted. All dates and hours are
        Europe/Sofia.
      </p>

      {isLoading && <Skeleton className="h-96 w-full" />}

      {failed && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-gray-100">
          Could not load the definitions from the API. They are served from the
          backend, beside the queries that compute them — showing a local copy
          here would risk describing maths that has since changed.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {metrics.map(definition => (
          <Card key={definition.key} id={definition.key} className="scroll-mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{definition.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-gray-800 dark:text-gray-100">{definition.counts}</p>

              {definition.excludes && (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Excludes: </span>
                  {definition.excludes}
                </p>
              )}

              {definition.caveat && (
                <p className="rounded border border-amber-200 bg-amber-50 p-2 text-gray-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-gray-100">
                  <span className="font-medium">Easy to misread: </span>
                  {definition.caveat}
                </p>
              )}

              {definition.related.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Read with
                  {' '}
                  {definition.related.map((key, index) => (
                    <span key={key}>
                      {index > 0 && ', '}
                      <Link href={`#${key}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
                        {byKey[key]?.label ?? key}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ReportsShell>
  );
}
