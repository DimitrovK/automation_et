import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportPanel } from '@/components/reports/ReportPanel';

function state(overrides = {}) {
  return { data: null, isLoading: false, error: null, notDeployed: false, refetch: vi.fn(), ...overrides };
}

describe('reportPanel', () => {
  it('reports its own failure instead of the page reporting it', async () => {
    // The pages handled errors at page level, so one failing endpoint replaced
    // every panel — including the ones that had loaded fine.
    render(
      <ReportPanel state={state({ error: 'Boom' }) as never}>
        {() => <div>content</div>}
      </ReportPanel>,
    );

    expect(await screen.findByText(/Boom/)).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('retries only itself', async () => {
    // Retrying should refetch the thing that failed, not the whole page.
    const refetch = vi.fn();
    render(
      <ReportPanel state={state({ error: 'Boom', refetch }) as never}>
        {() => <div>content</div>}
      </ReportPanel>,
    );

    (await screen.findByRole('button', { name: /retry|try again/i })).click();

    expect(refetch).toHaveBeenCalled();
  });

  it('shows content once its own data arrives, regardless of other panels', () => {
    render(
      <ReportPanel state={state({ data: { ok: true } }) as never}>
        {data => <div>{`loaded-${(data as { ok: boolean }).ok}`}</div>}
      </ReportPanel>,
    );

    expect(screen.getByText('loaded-true')).toBeInTheDocument();
  });

  it('gives children non-null data, so no call site repeats the guard', () => {
    // The render prop is the point: `!data` guards at every call site quietly
    // created a "loaded but empty" branch that rendered nothing at all.
    const child = vi.fn(() => <div>ok</div>);
    render(<ReportPanel state={state({ data: { value: 1 } }) as never}>{child as never}</ReportPanel>);

    expect(child).toHaveBeenCalledWith({ value: 1 });
  });

  it('shows a skeleton only before there is anything to show', () => {
    render(
      <ReportPanel state={state({ isLoading: true }) as never}>
        {() => <div>content</div>}
      </ReportPanel>,
    );

    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('keeps the previous numbers on screen while refetching', () => {
    // Changing a filter refetches every panel. Blanking them all to skeletons
    // flashes the page and makes it jump as each one lands again — one
    // filter-out-of-date numbers, dimmed, are more useful than grey boxes.
    render(
      <ReportPanel state={state({ data: { ok: true }, isLoading: true }) as never}>
        {() => <div>content</div>}
      </ReportPanel>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });
});

describe('no page hand-rolls the panel', () => {
  it('has no page branching on error/isLoading itself', async () => {
    // Eight of ten pages wrote the triad out by hand, which had two costs. The
    // skeleton was sized differently on each (h-64, h-72, h-80, h-96), so the
    // page jumped by a different amount depending on which report you opened —
    // and more importantly the branch sat at PAGE level, so one slow endpoint
    // blanked panels that had already loaded, and one failing endpoint replaced
    // panels that were fine.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    const root = join(process.cwd(), 'app', 'reports');
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.tsx')) {
          pages.push(full);
        }
      }
    };
    walk(root);

    // A walk that silently found nothing would let this guard pass forever.
    // Verified: pointing the roots at a directory with no .tsx files made it
    // report 4 passing assertions over zero files.
    expect(pages.length, 'walk found no files — this guard would pass vacuously')
      .toBeGreaterThan(5);

    const offenders = pages.filter(file =>
      readFileSync(file, 'utf8').includes('isLoading || !data'));

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Use ReportPanel — it owns loading, error and retry per panel',
    ).toEqual([]);
  });
});
