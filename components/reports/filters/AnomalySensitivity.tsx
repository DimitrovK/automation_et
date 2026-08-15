'use client';

import { Button } from '@/components/ui/button';

/**
 * How much movement is worth interrupting someone for.
 *
 * The thresholds used to be constants — a reasonable guess that nobody could
 * check. A panel tuned too loose gets ignored, one tuned too tight stays quiet
 * through a real decline, and there was no way to find out which without
 * editing the backend.
 *
 * Presets rather than free numbers: two spinboxes invite fiddling and produce
 * values nobody can justify later. These are three defensible positions, and
 * the response echoes whichever was used.
 */
export type Sensitivity = 'broad' | 'default' | 'strict';

// Exported beside its component on purpose: a recharts tree renders nothing
// measurable in jsdom, so the pure part has to be reachable from a test. The
// cost is fast-refresh reloading this file rather than hot-swapping it.
// eslint-disable-next-line react-refresh/only-export-components
export const SENSITIVITY_PRESETS: Record<Sensitivity, {
  label: string;
  hint: string;
  min_volume: number;
  min_change_pct: number;
}> = {
  broad: {
    label: 'Broad',
    hint: 'Smaller games and gentler moves. Expect more noise.',
    min_volume: 10,
    min_change_pct: 15,
  },
  default: {
    label: 'Balanced',
    hint: 'The shipped defaults: 30+ sessions, moves over 25%.',
    min_volume: 30,
    min_change_pct: 25,
  },
  strict: {
    label: 'Strict',
    hint: 'Only big games moving a lot. Quiet by design.',
    min_volume: 100,
    min_change_pct: 50,
  },
};

export function AnomalySensitivity({ value, onChange }: {
  value: Sensitivity;
  onChange: (next: Sensitivity) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Sensitivity</span>
      {(Object.keys(SENSITIVITY_PRESETS) as Sensitivity[]).map((key) => {
        const preset = SENSITIVITY_PRESETS[key];
        return (
          <Button
            key={key}
            size="sm"
            variant={value === key ? 'default' : 'outline'}
            title={preset.hint}
            onClick={() => onChange(key)}
          >
            {preset.label}
          </Button>
        );
      })}
      <span className="text-xs text-muted-foreground">
        {SENSITIVITY_PRESETS[value].hint}
      </span>
    </div>
  );
}
