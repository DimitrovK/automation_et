import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';

describe('report table cells', () => {
  it('right-aligns on request and left-aligns by default', () => {
    // Alignment is a property of the data — numbers right, labels left — so it
    // is a prop. As a className it was a per-table decision, and three tables
    // disagreed.
    const { container } = render(
      <ReportTable>
        <ReportHead>
          <Th>Game</Th>
          <Th align="right">Sessions</Th>
        </ReportHead>
        <tbody>
          <ReportRow>
            <Td strong>Grid</Td>
            <Td align="right">12</Td>
          </ReportRow>
        </tbody>
      </ReportTable>,
    );

    const [left, right] = [...container.querySelectorAll('th')];

    expect(left.className).not.toContain('text-right');
    expect(right.className).toContain('text-right');
  });

  it('drops the trailing gap on the last cell', () => {
    // Previously a manual choice per table, so a table that gained a column kept
    // a stray gap on the right of its old last one.
    const { container } = render(
      <ReportTable>
        <tbody>
          <ReportRow><Td>only</Td></ReportRow>
        </tbody>
      </ReportTable>,
    );

    expect(container.querySelector('td')?.className).toContain('last:pr-0');
  });

  it('lets a caller override padding without losing the rest', () => {
    // twMerge, not concatenation: the dense cohort grid passes py-1.5 and must
    // actually get it rather than having py-2 win by coming first.
    const { container } = render(
      <ReportTable>
        <tbody>
          <ReportRow><Td className="py-1.5">tight</Td></ReportRow>
        </tbody>
      </ReportTable>,
    );
    const cell = container.querySelector('td')!;

    expect(cell.className).toContain('py-1.5');
    expect(cell.className).not.toContain('py-2');
  });
});

describe('no table is hand-rolled', () => {
  it('has no raw table markup on the reporting surface', () => {
    // Eight tables across seven files had produced four different header-cell
    // treatments for one thing. The differences are too small to notice on one
    // page and big enough that columns do not line up between two.
    const roots = [
      join(process.cwd(), 'app', 'reports'),
      join(process.cwd(), 'components', 'reports'),
    ];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '__tests__') {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
          files.push(full);
        }
      }
    };
    for (const root of roots) {
      walk(root);
    }

    // A walk that silently found nothing would let this guard pass forever.
    // Verified: pointing the roots at a directory with no .tsx files made it
    // report 4 passing assertions over zero files.
    expect(files.length, 'walk found no files — this guard would pass vacuously')
      .toBeGreaterThan(10);

    const offenders = files
      // The primitive is where the raw elements are supposed to live.
      .filter(file => !file.endsWith('ReportTable.tsx'))
      .filter(file => /<(?:table|th|td)[\s/>]/.test(readFileSync(file, 'utf8')));

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Use ReportTable / ReportHead / ReportRow / Th / Td',
    ).toEqual([]);
  });
});
