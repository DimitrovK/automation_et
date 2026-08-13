import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { resetGlossaryCache, useGlossary } from '@/hooks/use-glossary';
import { ReportsAPI } from '@/lib/reports-api';

const METRIC = {
  key: 'distinct_players',
  label: 'Players',
  counts: 'Distinct accounts that started a session.',
  excludes: 'Bot accounts.',
  caveat: 'NOT additive across games or days.',
  related: [],
};

afterEach(() => {
  resetGlossaryCache();
  vi.restoreAllMocks();
});

function Consumer() {
  const { metrics, failed } = useGlossary();
  return <div>{failed ? 'failed' : `count-${metrics.length}`}</div>;
}

describe('useGlossary', () => {
  it('fetches once no matter how many consumers mount', async () => {
    // The games table renders one MetricInfo per sortable column. Without a
    // shared request that is a burst of identical calls on every page render.
    const spy = vi.spyOn(ReportsAPI, 'getGlossary').mockResolvedValue({ metrics: [METRIC] });

    render(<><Consumer /><Consumer /><Consumer /><Consumer /><Consumer /></>);
    await screen.findAllByText('count-1');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure instead of caching the rejection forever', async () => {
    // Keeping a rejected promise would make one transient error permanent for
    // the whole session.
    const spy = vi.spyOn(ReportsAPI, 'getGlossary').mockRejectedValueOnce(new Error('boom'));

    const first = render(<Consumer />);
    await screen.findByText('failed');
    first.unmount();

    spy.mockResolvedValue({ metrics: [METRIC] });
    render(<Consumer />);
    await screen.findByText('count-1');

    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('metricInfo', () => {
  it('renders without an auth provider', async () => {
    // It is presentational; requiring auth context made it throw wherever it
    // was rendered in isolation, which broke unrelated component tests.
    vi.spyOn(ReportsAPI, 'getGlossary').mockResolvedValue({ metrics: [METRIC] });

    expect(() => render(<MetricInfo metric="distinct_players" />)).not.toThrow();
    expect(await screen.findByLabelText(/What "Players" means/)).toBeTruthy();
  });

  it('says nothing rather than guessing when the glossary cannot load', async () => {
    // The whole point of serving these from the BE is that a local copy can
    // drift from the maths. Falling back to one here would reintroduce that.
    vi.spyOn(ReportsAPI, 'getGlossary').mockRejectedValue(new Error('offline'));

    render(<MetricInfo metric="distinct_players" />);
    (await screen.findByLabelText(/means/)).click();

    expect(await screen.findByText(/might no longer match how this is calculated/)).toBeTruthy();
  });
});
