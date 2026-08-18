import { parsePositiveIntParam } from '@/lib/url-params';

/**
 * The nation carried in `/footballer-management?nation=<id>`.
 *
 * An id, not a short code. `/data/footballers/` filters `nation` through a
 * django-filter `ModelChoiceFilter` built from the ForeignKey, so the value has
 * to be a primary key — `?nation=ENG` comes back as "Select a valid choice.
 * That choice is not one of the available choices." and the page renders it as
 * a top-level error, which reads as the page being broken.
 *
 * The name/nationality/short-code form of this filter does exist, but on
 * `FootballerSearchView`, which is a different endpoint from the one this page
 * lists with. Every nations analytics row carries the id anyway.
 */
export function parseNationId(raw: string | null | undefined): number | null {
  return parsePositiveIntParam(raw);
}

/**
 * Where a nation's footballers can be seen and edited.
 *
 * The other end of `parseNationId`, kept in the same module so the two halves
 * of the link cannot drift apart.
 */
export function nationFootballersHref(id: number): string {
  return `/footballer-management?nation=${id}`;
}
