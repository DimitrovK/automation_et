import { useCallback, useState } from 'react';

export type RowSyncStatus = 'loading' | 'success' | 'error';

export type UseRowSyncReturn<K extends string | number> = {
  /** Current operation status per row key. Absent = idle. */
  status: Record<K, RowSyncStatus>;
  /** Error message per row key (only set when status === 'error'). */
  errors: Record<K, string>;
  /** True while a `runAll(...)` batch is in flight; used to gate the "Sync All" button. */
  syncingAll: boolean;
  /**
   * Run a single per-row async op. Marks the row `loading`, awaits, then
   * `success` or `error`. Clears any previous error on retry. Rejects on
   * failure so a `runAll` caller can decide to short-circuit; per-row
   * status is set whether or not the caller catches.
   */
  run: (key: K, op: () => Promise<void>, fallbackError?: string) => Promise<void>;
  /**
   * Sequentially run a batch of already-keyed ops (each typically a
   * closure that calls `run(key, ...)` internally). Sets `syncingAll`
   * for the duration and swallows individual rejections so one failed
   * row doesn't stop the rest — per-row status is what the UI reads.
   */
  runAll: (ops: Array<() => Promise<void>>) => Promise<void>;
  /** Convenience: is this row's op currently in `loading`. */
  isPending: (key: K) => boolean;
};

/**
 * Per-row sync status manager for inline-update tables (e.g. International
 * Career, Senior Career). Each row has independent loading/success/error
 * state, keyed by anything stable (nation_id, team_id, string composite).
 *
 * Pair with `<RowSyncButton>` from `components/career-lookup/shared` to
 * render the action button + transient status badges in one place.
 */
export function useRowSync<K extends string | number>(): UseRowSyncReturn<K> {
  const [status, setStatus] = useState<Record<K, RowSyncStatus>>({} as Record<K, RowSyncStatus>);
  const [errors, setErrors] = useState<Record<K, string>>({} as Record<K, string>);
  const [syncingAll, setSyncingAll] = useState(false);

  const run = useCallback(async (key: K, op: () => Promise<void>, fallbackError = 'Operation failed') => {
    setStatus(prev => ({ ...prev, [key]: 'loading' }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      await op();
      setStatus(prev => ({ ...prev, [key]: 'success' }));
    } catch (err) {
      setStatus(prev => ({ ...prev, [key]: 'error' }));
      setErrors(prev => ({
        ...prev,
        [key]: err instanceof Error ? err.message : fallbackError,
      }));
      throw err;
    }
  }, []);

  const runAll = useCallback(async (ops: Array<() => Promise<void>>) => {
    setSyncingAll(true);
    try {
      for (const op of ops) {
        try {
          await op();
        } catch {
          // Per-row status already captured by `run()`; keep going.
        }
      }
    } finally {
      setSyncingAll(false);
    }
  }, []);

  const isPending = useCallback((key: K) => status[key] === 'loading', [status]);

  return { status, errors, syncingAll, run, runAll, isPending };
}
