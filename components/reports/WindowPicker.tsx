'use client';

import type { ReportWindow } from '@/types/reports';
import { Button } from '@/components/ui/button';
import { REPORT_WINDOWS } from '@/types/reports';

/**
 * Window selector. The options mirror ALLOWED_WINDOWS on the BE, which rejects
 * anything else with a 400 — so this can't drift into requests that fail.
 */
export function WindowPicker({
  value,
  onChange,
  includeBots,
  onIncludeBotsChange,
}: {
  value: ReportWindow;
  onChange: (w: ReportWindow) => void;
  includeBots: boolean;
  onIncludeBotsChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">Window</span>
      {REPORT_WINDOWS.map(w => (
        <Button
          key={w}
          size="sm"
          variant={w === value ? 'default' : 'outline'}
          onClick={() => onChange(w)}
        >
          {w}
          d
        </Button>
      ))}
      <Button
        size="sm"
        variant={includeBots ? 'default' : 'outline'}
        className="ml-2"
        onClick={() => onIncludeBotsChange(!includeBots)}
        title="Bot/simulation accounts (is_dummy) are excluded by default"
      >
        {includeBots ? 'Bots included' : 'Bots excluded'}
      </Button>
    </div>
  );
}
