import type { DurationRow } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { longSessionReason } from '@/lib/long-session-reason';

function row(over: Partial<DurationRow>): DurationRow {
  return {
    game_type: 'conquest',
    supported: true,
    reason: null,
    sessions: 100,
    measured: 100,
    coverage_pct: 100,
    median_seconds: 86400,
    p90_seconds: 90000,
    long_sessions: 72,
    long_sessions_pct: 72,
    single_sitting: false,
    ...over,
  };
}

describe('longSessionReason', () => {
  it('names the sweeper, its ceiling and how much of the sample it closed', () => {
    // Conquest's 24h median IS its idle timeout. Quoting it as attention is the
    // error this exists to stop.
    const why = longSessionReason(row({
      long_reason: 'idle_sweep',
      idle_finish_seconds: 86400,
      swept_pct: 72,
      median_excluding_swept_seconds: 480,
    }));

    expect(why?.label).toBe('Idle sweep');
    expect(why?.detail).toContain('72%');
    // "24h", not formatDuration's "1.0d": this is a configured timeout, and
    // whoever checks it against the sweeper task will look for 24 hours.
    expect(why?.detail).toContain('24h');
    expect(why?.detail).toContain('sweeper\'s clock');
  });

  it('offers the played-out median as the comparable number', () => {
    const why = longSessionReason(row({
      long_reason: 'idle_sweep',
      idle_finish_seconds: 86400,
      swept_pct: 72,
      median_excluding_swept_seconds: 480,
    }));

    expect(why?.playedOut).toBe('8.0m');
  });

  it('says a genuinely long game is long, without inventing a sweeper', () => {
    const why = longSessionReason(row({ game_type: 'team_ties', long_reason: 'long_play' }));

    expect(why?.label).toBe('Long play');
    expect(why?.detail).toContain('not being closed by a timeout');
    expect(why?.playedOut).toBeNull();
  });

  it('says nothing at all when the backend has not explained it', () => {
    // A deploy window, or a game nobody has classified. Silence beats asserting
    // the wrong one of two opposite explanations — which is what the page did
    // before, for every long game at once.
    expect(longSessionReason(row({}))).toBeNull();
    expect(longSessionReason(row({ long_reason: null }))).toBeNull();
  });

  it('names the timeout without inventing a duration for it', () => {
    // The backend always sends the ceiling with an idle_sweep, but the type
    // allows its absence — and formatDuration(null) is "—", so the sentence
    // would have read "closed after —", which is worse than not naming it.
    const why = longSessionReason(row({ long_reason: 'idle_sweep', swept_pct: 72 }));

    expect(why?.detail).toBe(
      '72% of measured sessions were closed by an idle timeout, so their length is the sweeper\'s clock rather than time spent playing.',
    );
  });

  it('still makes the claim when neither number arrived', () => {
    const why = longSessionReason(row({ long_reason: 'idle_sweep', swept_pct: null }));

    expect(why?.detail).toBe(
      'Sessions left idle are closed by an idle timeout, so their length is the sweeper\'s clock rather than time spent playing.',
    );
  });

  it('treats a zero ceiling as no ceiling', () => {
    // "closed after 0h idle" is not a fact about anything.
    const why = longSessionReason(row({ long_reason: 'idle_sweep', idle_finish_seconds: 0, swept_pct: 50 }));

    expect(why?.detail).toContain('by an idle timeout');
    expect(why?.detail).not.toContain('0h');
  });

  it('still explains a sweep whose played-out median is unknown', () => {
    // Every session swept: there is no played-out median to show, but the
    // reason is still the most important thing on the row.
    const why = longSessionReason(row({
      long_reason: 'idle_sweep',
      idle_finish_seconds: 86400,
      swept_pct: 100,
      median_excluding_swept_seconds: null,
    }));

    expect(why?.label).toBe('Idle sweep');
    expect(why?.playedOut).toBeNull();
  });
});
