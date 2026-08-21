/**
 * Deep links into `/footballer-management`.
 *
 * Kept beside each other so the tab names cannot drift from the page that
 * reads them back out of the URL.
 */

/** The footballer's Career Path record — how players actually did against them. */
export function careerPathTabHref(footballerId: number): string {
  return `/footballer-management?footballer=${footballerId}&tab=career-path`;
}

/** The edit form, already loaded with that footballer. */
export function editFootballerHref(footballerId: number): string {
  return `/footballer-management?edit=${footballerId}`;
}
