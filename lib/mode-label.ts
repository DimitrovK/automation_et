/**
 * A game mode as a person would write it.
 *
 * Three copies of this had grown, and they disagreed: the career-path panels
 * lowercased (`head to head`) while the multiplayer breakdown title-cased
 * (`Head To Head`), so the same seven modes were spelled two ways on two pages.
 *
 * Small words stay lowercase unless they lead. That one rule is what makes the
 * output match the labels the backend declares on `CareerPath.MODE_CHOICES`
 * — `Head to Head`, not `Head To Head` — for all seven modes, WITHOUT keeping a
 * copy of that enum here. A copied enum is the thing that rots; ordinary
 * title-casing is not.
 */
const MINOR = new Set(['to', 'of', 'and', 'the', 'a', 'an', 'or', 'vs']);

export function modeLabel(mode: string | null | undefined): string {
  // Quiz has no mode column, so its rows arrive as null rather than being
  // dropped — a room with no mode is still a room.
  if (!mode) {
    return 'No mode';
  }

  return mode
    .split('_')
    .map((part, index) => {
      const word = part.toLowerCase();
      return index > 0 && MINOR.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
