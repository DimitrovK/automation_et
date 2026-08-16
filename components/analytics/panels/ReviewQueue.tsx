import type { ReviewQueue as ReviewQueueCounts } from '@/types/reports';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * What is waiting to be reviewed, when anything is.
 *
 * Renders nothing when the queue is empty, and that is deliberate rather than a
 * fallback: not every deployment uses the review states at all. On a catalogue
 * where everything is approved on creation, a permanent row of zeros would be a
 * workflow the page invented. If it appears, there is something to do.
 */
const STATUS_LABELS: Record<string, string> = {
  AWAITING_REVISION: 'Awaiting revision',
  AWAITING_CHANGE_CHECK: 'Awaiting change check',
  DENIED: 'Denied',
};

export function ReviewQueue({ counts, subject }: {
  counts: ReviewQueueCounts | undefined;
  /** What is queued — "footballers", "teams". Read into the description. */
  subject: string;
}) {
  const entries = Object.entries(counts ?? {});
  if (entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting for review</CardTitle>
        <CardDescription>
          {`${subject[0].toUpperCase()}${subject.slice(1)} that are not approved, so no game can use them yet.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetricRow
          columns={3}
          metrics={entries.map(([status, count]) => ({
            label: STATUS_LABELS[status] ?? status,
            value: count.toLocaleString(),
          }))}
        />
      </CardContent>
    </Card>
  );
}
