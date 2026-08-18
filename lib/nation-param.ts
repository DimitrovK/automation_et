/** Longer than any nation name or code, short enough to bound the LIKE. */
const MAX_NATION_FILTER = 60;

/**
 * The nation carried in `/footballer-management?nation=<code>`.
 *
 * The nations analytics page links every row here, so this arrives from a URL
 * and can be anything. `/data/footballers/` matches it against name,
 * nationality or short code with a LIKE, so the risk is not a bad query but an
 * unbounded one — and a blank value would read as a filter that is switched on
 * while narrowing nothing.
 *
 * The links send the short code. A hand-typed full name is equally valid,
 * because the endpoint accepts both.
 */
export function parseNationFilter(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value || value.length > MAX_NATION_FILTER) {
    return null;
  }
  return value;
}

/**
 * Where a nation's footballers can be seen and edited.
 *
 * The other end of `parseNationFilter`, kept in the same module so the two
 * halves of the link cannot drift apart. The short code rather than the id:
 * `/data/footballers/` filters by name, nationality or short code, and the id
 * is not one of them.
 */
export function nationFootballersHref(short: string): string {
  return `/footballer-management?nation=${encodeURIComponent(short)}`;
}
