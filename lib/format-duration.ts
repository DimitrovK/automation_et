/**
 * Human-readable durations.
 *
 * Session lengths here span five orders of magnitude — Avatar of Football's
 * median is 12 seconds, Conquest's is 24 hours — so a single unit is unreadable
 * at one end or the other.
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = seconds / 60;
    return `${minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)}m`;
  }
  if (seconds < 86_400) {
    const hours = seconds / 3600;
    return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)}h`;
  }
  const days = seconds / 86_400;
  return `${days < 10 ? days.toFixed(1) : Math.round(days)}d`;
}
