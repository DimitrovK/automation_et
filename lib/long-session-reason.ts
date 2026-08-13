/**
 * Why a game's sessions are long — in words, per game.
 *
 * The duration page used to say one thing about every long-lived game: that a
 * session there "spans a day or more by design". That is true of a campaign
 * game and false of Conquest, whose 24-hour median is its idle sweeper closing
 * abandoned sessions. Same number, opposite finding, and the page asserted the
 * flattering one for both.
 *
 * Pure so it can be tested directly — the claim is the risky part here, not the
 * table markup.
 */

import type { DurationRow } from '@/types/reports';
import { formatDuration } from '@/lib/format-duration';

export type LongSessionReason = {
  /** Short label for the table cell. */
  label: string;
  /** The sentence under it — what produced the number. */
  detail: string;
  /** The comparable median, when the headline one isn't. */
  playedOut: string | null;
};

/**
 * The sweeper's ceiling in the units it was configured in.
 *
 * `formatDuration` renders 86,400s as "1.0d", which is right for a measured
 * session and wrong for a setting: the timeout is 24 hours, and someone
 * checking it against the task will look for that number.
 */
function ceilingLabel(seconds: number | null | undefined): string {
  if (seconds && seconds % 3600 === 0) {
    return `${seconds / 3600}h`;
  }
  return formatDuration(seconds ?? null);
}

export function longSessionReason(row: DurationRow): LongSessionReason | null {
  if (row.long_reason === 'idle_sweep') {
    const ceiling = ceilingLabel(row.idle_finish_seconds);
    const share = row.swept_pct === null || row.swept_pct === undefined ? null : `${row.swept_pct}%`;
    return {
      label: 'Idle sweep',
      detail: share === null
        ? `Sessions left idle are closed after ${ceiling}, so their length is the sweeper's clock rather than time spent playing.`
        : `${share} of measured sessions were closed after ${ceiling} idle, so their length is the sweeper's clock rather than time spent playing.`,
      playedOut: row.median_excluding_swept_seconds === null || row.median_excluding_swept_seconds === undefined
        ? null
        : formatDuration(row.median_excluding_swept_seconds),
    };
  }

  if (row.long_reason === 'long_play') {
    return {
      label: 'Long play',
      detail: 'Sessions genuinely run long — they are not being closed by a timeout, so the length is time in the game.',
      playedOut: null,
    };
  }

  // A backend predating long_reason, or a game whose length nobody has
  // explained. Saying nothing beats asserting the wrong one of the two.
  return null;
}
