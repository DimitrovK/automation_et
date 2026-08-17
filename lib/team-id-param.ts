/**
 * The team id carried in `/team-players?teamId=<id>`.
 *
 * The teams analytics page links every row here, so this value arrives from a
 * URL rather than from the page's own search box — which means it can be
 * anything. It goes straight into a `/data/team/<id>/players/` path, and that
 * endpoint answers a nonsense id with a 404 which the page explains as "the
 * backend may not have this deployed yet". True for a real missing endpoint,
 * an actively misleading thing to say about a typo.
 *
 * So it is validated here rather than trusted: a whole positive number, or
 * nothing at all.
 */
export function parseTeamId(raw: string | null | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
