// Pure formatting helpers for the User Hub (no React) so components stay
// fast-refresh friendly and the logic is unit-testable in isolation.

import type { SuspensionScope } from '@/types/user-hub';

/** Turn a kebab slug into a readable label until a slug→display-name map exists. */
export function prettySlug(slug: string): string {
  return slug
    .split('-')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Sort a game-popularity map into chart rows, most-favourited first. */
export function toChartData(
  gamePopularity: Record<string, number>,
): { slug: string; label: string; count: number }[] {
  return Object.entries(gamePopularity)
    .map(([slug, count]) => ({ slug, label: prettySlug(slug), count }))
    .sort((a, b) => b.count - a.count);
}

/** Human label for a suspension scope. */
export function suspensionLabel(scope: SuspensionScope): string {
  switch (scope) {
    case 'MULTIPLAYER': return 'MP suspended';
    case 'ALL_GAMES': return 'Games suspended';
    case 'FULL_PLATFORM': return 'Full suspension';
    default: return '';
  }
}
