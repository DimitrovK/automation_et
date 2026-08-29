/**
 * Human labels for Grid criterion-type enums.
 *
 * The analytics tables printed wire values ('PLAYED_FOR_CLUB',
 * 'CLUB_GOALS_GTE') — legible to whoever wrote the enum, furniture to
 * everyone else. Explicit entries cover the names the generic prettifier
 * would mangle; everything unknown falls through to prettified words so a
 * new BE type never renders as a crash or a blank.
 */

const EXPLICIT: Record<string, string> = {
  BALLON_DOR_WINNER: 'Ballon d\'Or winner',
  BALLON_DOR_TOP_N: 'Ballon d\'Or top N',
  GOLDEN_SHOE_WINNER: 'Golden Shoe winner',
  INTERNATIONAL_CAPS_GTE: 'International caps threshold',
  INTERNATIONAL_GOALS_GTE: 'International goals threshold',
  CLUB_GOALS_GTE: 'Club goals threshold',
  TOURNAMENT_BEST_GOALKEEPER: 'Tournament best goalkeeper',
  TOURNAMENT_BEST_YOUNG_PLAYER: 'Tournament best young player',
};

export function criterionTypeLabel(criterionType: string): string {
  const explicit = EXPLICIT[criterionType];
  if (explicit) {
    return explicit;
  }
  const words = criterionType.toLowerCase().split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
