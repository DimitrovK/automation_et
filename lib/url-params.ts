/**
 * A row id carried in a query string.
 *
 * These arrive from links on other pages, so they can be anything, and they go
 * straight into a URL path or a primary-key filter. A value that is not an id
 * cannot fail quietly: `/data/team/<id>/players/` answers with a 404 the page
 * explains as "the backend may not have this deployed yet", and
 * `/data/footballers/?nation=` answers with a Django validation message
 * rendered at the top of the screen. Both read as the page being broken rather
 * than the link being wrong.
 *
 * So it is validated here rather than trusted: a whole positive number, or
 * nothing at all.
 */
export function parsePositiveIntParam(raw: string | null | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
