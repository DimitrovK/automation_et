'use client';

import type { GridAnalyticsResponse, GridCriterionRow } from '@/types/reports';
import { useState } from 'react';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { PanelCard, Segmented } from '@/components/reports/primitives/PanelCard';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { criterionTypeLabel } from '@/lib/criterion-type-label';
import { cn } from '@/lib/utils';

/**
 * The criterion worklist — Grid's most actionable content signal.
 *
 * A grid is generated, so nobody edits a grid; what an admin tunes is the
 * criterion (its weights, its entity data). A criterion whose cells attract
 * wrong placements at a high rate is either ambiguous or its entity data is
 * wrong — a missing transfer, a dual nationality — and that is a fix in the
 * football data, findable from this table.
 */

/** At or above this wrong rate, a criterion deserves an editor's look. */
const NOTABLE_WRONG_PCT = 60;

function CriterionTable({ rows, showType = true }: { rows: GridCriterionRow[]; showType?: boolean }) {
  return (
    <ReportTable>
      <ReportHead>
        <Th>Criterion</Th>
        {showType && <Th>Type</Th>}
        <Th align="right" title="Distinct sessions that placed into a cell carrying it">Sessions</Th>
        <Th align="right" title="Placements into cells carrying it">Attempts</Th>
        <Th align="right">Wrong</Th>
        <Th align="right" title="Wrong placements as a share of attempts">Wrong rate</Th>
      </ReportHead>
      <tbody>
        {rows.map(row => (
          <ReportRow key={`${row.criterion_type}:${row.label}`}>
            <Td strong>{row.label}</Td>
            {showType && (
              <Td className="text-muted-foreground">
                <span title={row.criterion_type}>{criterionTypeLabel(row.criterion_type)}</span>
              </Td>
            )}
            <Td align="right">{row.sessions.toLocaleString()}</Td>
            <Td align="right">{row.attempts.toLocaleString()}</Td>
            <Td align="right">{row.wrong.toLocaleString()}</Td>
            <Td
              align="right"
              strong
              className={cn(
                row.wrong_pct >= NOTABLE_WRONG_PCT && 'text-amber-600 dark:text-amber-500',
              )}
            >
              {`${row.wrong_pct}%`}
            </Td>
          </ReportRow>
        ))}
      </tbody>
    </ReportTable>
  );
}

type CriteriaTab = 'mislead' | 'types' | 'clubs';

const TABS: readonly { value: CriteriaTab; label: string }[] = [
  { value: 'mislead', label: 'Misleading' },
  { value: 'types', label: 'By type' },
  { value: 'clubs', label: 'Clubs' },
];

const TAB_DESCRIPTIONS: Record<CriteriaTab, string> = {
  mislead: 'Wrong placements are attributed to the cell the player chose — the criteria that misled the click. '
    + 'A persistently high rate usually means the entity data is wrong or ambiguous, not that the puzzle is hard: the fix lives in the football data.',
  types: 'Every criterion type by how much play it carries. Reach is stated via attempts — session counts do not add '
    + 'across identities, so a per-type session total would double-count.',
  clubs: 'The club-criterion slice by reach — which teams players see most, and how often placing into their cells goes wrong.',
};

function CriterionTypeTable({ data }: { data: GridAnalyticsResponse }) {
  if (data.criterion_types.length === 0) {
    return <EmptyState>No placements in this window.</EmptyState>;
  }
  return (
    <ReportTable>
      <ReportHead>
        <Th>Type</Th>
        <Th align="right" title="Distinct criterion identities of this type that were played">Identities</Th>
        <Th align="right">Attempts</Th>
        <Th align="right">Wrong</Th>
        <Th align="right">Wrong rate</Th>
      </ReportHead>
      <tbody>
        {data.criterion_types.map(row => (
          <ReportRow key={row.criterion_type}>
            <Td strong>
              <span title={row.criterion_type}>{criterionTypeLabel(row.criterion_type)}</span>
            </Td>
            <Td align="right">{row.identities.toLocaleString()}</Td>
            <Td align="right">{row.attempts.toLocaleString()}</Td>
            <Td align="right">{row.wrong.toLocaleString()}</Td>
            <Td align="right">{`${row.wrong_pct}%`}</Td>
          </ReportRow>
        ))}
      </tbody>
    </ReportTable>
  );
}

/** The headline while folded: how many criteria sit at or above the notable wrong rate. */
export function criteriaSummary(data: GridAnalyticsResponse): string | undefined {
  if (data.criteria.length === 0) {
    return undefined;
  }
  const notable = data.criteria.filter(row => row.wrong_pct >= NOTABLE_WRONG_PCT).length;
  return notable > 0
    ? `${notable} ${notable === 1 ? 'criterion' : 'criteria'} at ${NOTABLE_WRONG_PCT}%+ wrong`
    : `worst: ${data.criteria[0]!.label} at ${data.criteria[0]!.wrong_pct}% wrong`;
}

/**
 * The criterion worklist with its two reach views as tabs: one card, because
 * all three read the same placements and answer "which criteria need work".
 */
export function GridCriteria({ data }: { data: GridAnalyticsResponse }) {
  const [tab, setTab] = useState<CriteriaTab>('mislead');
  return (
    <PanelCard
      id="grid-criteria"
      title="Criteria"
      info={<MetricInfo metric="grid_wrong_pct" />}
      summary={criteriaSummary(data)}
      description={TAB_DESCRIPTIONS[tab]}
      actions={<Segmented label="Criteria view" value={tab} options={TABS} onChange={setTab} />}
      contentClassName="overflow-x-auto"
    >
      {tab === 'mislead' && (
        data.criteria.length === 0
          ? (
              <EmptyState hint="Criteria need 25 sessions before their rate is stated.">
                Nothing crossed the volume threshold in this window.
              </EmptyState>
            )
          : <CriterionTable rows={data.criteria} />
      )}
      {tab === 'types' && <CriterionTypeTable data={data} />}
      {tab === 'clubs' && (
        data.teams.length === 0
          ? <EmptyState>No club criterion crossed the threshold in this window.</EmptyState>
          : <CriterionTable rows={data.teams} showType={false} />
      )}
    </PanelCard>
  );
}
