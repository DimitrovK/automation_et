/**
 * A stable anchor id from a section title.
 *
 * In `lib/` rather than beside `SectionHeader` because exporting a helper from a
 * component file breaks fast refresh — the same lint rule that moved
 * `Sparkline`'s geometry and the global nav's data out of their components.
 */
export function sectionId(title: string): string {
  return `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}
