import type { SeasonCheck } from '@/types/reports';
import { Check, Circle, Dot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * From rewards to awards, worked out by the backend. An open step links to the
 * Django admin page that does it: nothing is edited from here.
 */
export function SeasonChecklist({ checks }: { checks: SeasonCheck[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist</CardTitle>
        <CardDescription>Open steps link to where they are done in the Django admin.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {checks.map(check => (
            <li key={check.label} className="flex gap-2">
              {check.done
                ? <Check aria-label="Done" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                : check.done === null
                  ? <Dot aria-label="Not due yet" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  : <Circle aria-label="To do" className="mt-0.5 size-4 shrink-0 text-amber-600" />}
              <span className="min-w-0">
                <span className="font-medium text-foreground">{check.label}</span>
                {check.detail && <span className="text-muted-foreground">{` · ${check.detail}`}</span>}
                {check.link && !check.done && (
                  <>
                    {' · '}
                    <a href={check.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{check.link_text}</a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
