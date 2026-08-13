/**
 * Solo or multiplayer, per player.
 *
 * The Players report has always counted multiplayer sessions — a room attaches
 * each player's session to the game's own table — but it could not show them.
 * Forty sessions read identically whether they belong to a solo grinder or a
 * lobby regular, and those are different players: one of them stops when their
 * friends do.
 *
 * Solo is derived from the total rather than counted separately, so the two can
 * never sum to something other than what was played.
 */

export type PlayStyle = {
  mp: number;
  solo: number;
  /** Share of sessions played against other people, 0..100. */
  mpPct: number;
  /**
   * A word for the split. Never null: `playStyle` returns null in its entirety
   * when there is nothing to characterise, so a style that exists always has a
   * label, and keeping null in the type would force call sites to handle a case
   * this cannot produce.
   */
  label: 'Multiplayer' | 'Mostly multiplayer' | 'Mixed' | 'Mostly solo' | 'Solo';
};

/**
 * Bands, not a gradient: "63% multiplayer" is a number to interpret, and the
 * point of the label is that it has already been interpreted. The ends are
 * exact — "Solo" means no multiplayer sessions at all, not "hardly any" —
 * because a player with one MP session is a different fact from a player with
 * none, and rounding that away is how a report starts lying quietly.
 */
export function playStyle(played: number, mp: number | undefined): PlayStyle | null {
  if (mp === undefined || played <= 0) {
    return null;
  }
  const bounded = Math.min(Math.max(mp, 0), played);
  const mpPct = (bounded / played) * 100;

  const label = bounded === 0
    ? 'Solo'
    : bounded === played
      ? 'Multiplayer'
      : mpPct >= 70
        ? 'Mostly multiplayer'
        : mpPct <= 30
          ? 'Mostly solo'
          : 'Mixed';

  return { mp: bounded, solo: played - bounded, mpPct: Math.round(mpPct * 10) / 10, label };
}
