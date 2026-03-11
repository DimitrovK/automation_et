/**
 * UI helper functions for bulk career lookup components.
 * Pure functions with no React state dependencies.
 */

import type { BulkLookupResult, DisplayStats } from '@/components/bulk-career-lookup/types';
import type { DeploymentLogEntry } from '@/types/deployment';
import type { Footballer } from '@/types/player';

// ─── Status Display Helpers ─────────────────────────────────────────────────

export function getStatusBadgeVariant(status: BulkLookupResult['status']) {
  switch (status) {
    case 'completed': return 'default';
    case 'processing': return 'secondary';
    case 'discrepancy': return 'destructive';
    case 'error': return 'destructive';
    default: return 'outline';
  }
}

export function getStatusText(status: BulkLookupResult['status']) {
  switch (status) {
    case 'pending': return 'Pending';
    case 'processing': return 'Processing...';
    case 'completed': return 'Completed';
    case 'discrepancy': return 'Discrepancy Found';
    case 'error': return 'Error';
    default: return 'Unknown';
  }
}

// ─── Link Helpers ───────────────────────────────────────────────────────────

export function getCareerLookupHref(footballer: Footballer, useWikipediaUrl: boolean) {
  if (useWikipediaUrl && footballer.wikipedia_url) {
    return `/career-lookup?url=${encodeURIComponent(footballer.wikipedia_url)}&useWikiUrl=true`;
  }
  return `/career-lookup?name=${encodeURIComponent(`${footballer.first_name} ${footballer.last_name}`)}&useWikiUrl=false`;
}

// ─── Stats Helpers ──────────────────────────────────────────────────────────

export function getDisplayStats(bulkResults: Map<number, BulkLookupResult>): DisplayStats {
  const results = Array.from(bulkResults.values());
  const completed = results.filter(r => r.status === 'completed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const discrepancies = results.filter(r => r.status === 'discrepancy').length;
  const processed = completed + errors + discrepancies;

  return {
    total: results.length,
    processed,
    withoutIssues: completed,
    discrepancies,
    errors,
  };
}

// ─── Log Display Helpers ────────────────────────────────────────────────────

export function getLogStyle(type: DeploymentLogEntry['type']) {
  switch (type) {
    case 'info':
      return 'text-blue-700 dark:text-blue-300';
    case 'request':
      return 'text-orange-700 dark:text-orange-300';
    case 'response':
      return 'text-green-700 dark:text-green-300';
    case 'success':
      return 'text-green-800 dark:text-green-200 font-medium';
    case 'error':
      return 'text-red-700 dark:text-red-300 font-medium';
    case 'loading':
      return 'text-blue-700 dark:text-blue-300';
    default:
      return 'text-gray-700 dark:text-gray-300';
  }
}

export function formatTimestamp(timestamp: Date) {
  return timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

// ─── Row Styling ────────────────────────────────────────────────────────────

// ─── Discrepancy Filtering ──────────────────────────────────────────────────

const NATION_DISCREPANCY_PREFIXES = [
  'National team not in database',
  'National team not synced',
  'National team stats mismatch',
  'National team in DB but not in Wikipedia',
  'Player has no international career',
];

/** Returns true if the discrepancy string is nation-related */
export function isNationDiscrepancy(discrepancy: string): boolean {
  return NATION_DISCREPANCY_PREFIXES.some(prefix => discrepancy.startsWith(prefix));
}

/** Filters out nation-related discrepancies, returning only career-related ones */
export function getCareerDiscrepancies(discrepancies: string[]): string[] {
  return discrepancies.filter(d => !isNationDiscrepancy(d));
}

// ─── Row Styling ────────────────────────────────────────────────────────────

export function getPlayerRowClassName(
  isCurrentlyProcessing: boolean,
  result: BulkLookupResult | undefined,
  isSelected: boolean,
) {
  if (isCurrentlyProcessing) {
    return 'border-2 border-blue-500 bg-blue-50 shadow-lg dark:bg-blue-900/20';
  }
  if (result?.status === 'completed') {
    return 'border-2 border-green-500 bg-green-50 shadow-md dark:bg-green-900/20';
  }
  if (result?.status === 'discrepancy') {
    return 'border-2 border-orange-500 bg-orange-50 shadow-md dark:bg-orange-900/20';
  }
  if (result?.status === 'error') {
    return 'border-2 border-red-500 bg-red-50 shadow-md dark:bg-red-900/20';
  }
  if (result?.status === 'pending') {
    return 'border-2 border-amber-500 bg-amber-50 shadow-md dark:bg-amber-900/20';
  }
  if (isSelected) {
    return 'border-2 border-gray-600 bg-gray-100 shadow-md ring-2 ring-gray-400/50 dark:bg-gray-800';
  }
  return 'border border-gray-200 hover:shadow-sm dark:border-gray-700';
}

export function getStatusBadgeClassName(status: BulkLookupResult['status']) {
  switch (status) {
    case 'completed':
      return 'border-green-300 bg-green-100 text-green-800';
    case 'processing':
      return 'border-blue-300 bg-blue-100 text-blue-800';
    case 'discrepancy':
      return 'border-orange-300 bg-orange-100 text-orange-800';
    case 'error':
      return 'border-red-300 bg-red-100 text-red-800';
    case 'pending':
      return 'border-amber-300 bg-amber-100 text-amber-800';
    default:
      return 'border-gray-300 bg-gray-100 text-gray-800';
  }
}
