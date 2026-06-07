import type { RowSyncStatus } from '@/hooks/use-row-sync';
import { AlertTriangle, Check, Loader2, Plus, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Variant = 'add' | 'update';

type RowSyncButtonProps = {
  /** `add` = blue + Plus (row not in DB); `update` = amber + Upload (row exists but stats differ). */
  variant: Variant;
  /** Current row status from `useRowSync`. Undefined = idle (render the action button). */
  status: RowSyncStatus | undefined;
  /** Error message to surface under the Failed badge. */
  error?: string;
  /** Click handler — typically wraps `useRowSync.run(key, op)`. */
  onClick: () => void;
  /** Disable while a batch (`syncingAll`) is in progress. */
  disabled?: boolean;
  /** Override the default label ("Add to DB" / "Update in DB"). */
  label?: string;
};

const VARIANT_CONFIG: Record<Variant, { label: string; Icon: typeof Plus; className: string }> = {
  add: {
    label: 'Add to DB',
    Icon: Plus,
    className: 'h-7 border-blue-300 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30',
  },
  update: {
    label: 'Update in DB',
    Icon: Upload,
    className: 'h-7 border-amber-300 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30',
  },
};

/**
 * Single per-row sync control: renders the action Button when idle, or one
 * of three transient status badges (Processing / Done / Failed) while the
 * op is in flight or just settled. The Done state is intentionally brief —
 * once the parent refetches DB data and re-renders, the row's
 * comparison status flips to `synced` and the caller stops rendering this
 * button entirely.
 *
 * The static "row is already in sync" / "ready to deploy" / "not found in DB"
 * badges live at the call site — they're domain-specific (nation vs club
 * wording) and never share state with this component.
 */
export function RowSyncButton({ variant, status, error, onClick, disabled, label }: RowSyncButtonProps) {
  if (status === 'loading') {
    return (
      <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-800">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Processing...
      </Badge>
    );
  }
  if (status === 'success') {
    return (
      <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
        <Check className="mr-1 size-3" />
        Done
      </Badge>
    );
  }
  if (status === 'error') {
    return (
      <>
        <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
          <AlertTriangle className="mr-1 size-3" />
          Failed
        </Badge>
        {error && <span className="max-w-[200px] text-xs text-red-600 dark:text-red-400">{error}</span>}
      </>
    );
  }

  const { Icon, label: defaultLabel, className } = VARIANT_CONFIG[variant];
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <Icon className="mr-1 size-3" />
      {label ?? defaultLabel}
    </Button>
  );
}
