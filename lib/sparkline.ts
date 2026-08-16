/**
 * The geometry behind the table sparkline.
 *
 * Its own module so the one decision worth testing is testable without a DOM,
 * and because exporting a helper from a component file breaks fast refresh —
 * the same reason `lib/growth-flow.ts` exists.
 */

export const WIDTH = 72;
export const HEIGHT = 20;
/** Half the stroke, so a flat line at either extreme is not clipped. */
const PADDING = 1.5;

export type SparklinePoint = number | null;

/**
 * Points to an SVG path, breaking the line wherever the data is unknown.
 *
 * `null` means the rollup never computed that day, which is NOT zero — drawn as
 * zero it puts a hole in the line that reads as a collapse. A break says "no
 * data here" in the only way a line can.
 */
export function toPath(points: SparklinePoint[]): string {
  const known = points.filter((point): point is number => point !== null);
  if (known.length < 2) {
    return '';
  }

  const highest = Math.max(...known);
  const lowest = Math.min(...known);
  const span = highest - lowest;
  const step = points.length > 1 ? (WIDTH - PADDING * 2) / (points.length - 1) : 0;

  let path = '';
  let penDown = false;
  points.forEach((point, index) => {
    if (point === null) {
      // Lift the pen. The next known point starts a new subpath rather than
      // joining across the gap, which would draw a line nobody measured.
      penDown = false;
      return;
    }
    const x = PADDING + index * step;
    // A flat series has no span to scale against; centre it rather than
    // dividing by zero and drawing it along the top edge.
    const y = span === 0
      ? HEIGHT / 2
      : HEIGHT - PADDING - ((point - lowest) / span) * (HEIGHT - PADDING * 2);
    path += `${penDown ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    penDown = true;
  });
  return path;
}

/** The viewBox both dimensions describe, so the component cannot drift from them. */
export const VIEWBOX = `0 0 ${WIDTH} ${HEIGHT}`;
