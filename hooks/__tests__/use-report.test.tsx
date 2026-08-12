import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useReport } from '@/hooks/use-report';

/**
 * Regression guard for an infinite request loop.
 *
 * useReport keys its effect on the fetcher's identity. Every reporting page
 * passes a static ReportsAPI method, which is stable for free — except the
 * player detail page, the only endpoint taking a bound argument. An inline
 * arrow there is a new function each render, so the effect refires, sets state,
 * re-renders, and requests the API forever. It hit production.
 */

function Harness({ fetcher }: { fetcher: (params?: unknown) => Promise<{ ok: boolean }> }) {
  const { data } = useReport(fetcher as never, { window: 30 } as never, true, 'test endpoint');
  return <div>{data ? 'loaded' : 'loading'}</div>;
}

describe('useReport', () => {
  it('fetches once for a stable fetcher', async () => {
    const fetcher = vi.fn(async () => ({ ok: true }));
    render(<Harness fetcher={fetcher} />);

    await screen.findByText('loaded');
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not loop when the caller rebuilds params each render', async () => {
    // Params are keyed by value, not identity — a fresh object with the same
    // contents must not count as a change.
    const fetcher = vi.fn(async () => ({ ok: true }));

    function RebuildsParams() {
      const { data } = useReport(fetcher as never, { window: 30, include_bots: false } as never, true, 'test');
      return <div>{data ? 'loaded' : 'loading'}</div>;
    }

    render(<RebuildsParams />);
    await screen.findByText('loaded');
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not loop when the fetcher is a fresh function every render', async () => {
    // The production bug, reproduced. Before the fix this reached ~2,000 calls
    // in 400ms; the fetcher is now invoked through a ref and is not an effect
    // dependency, so an unmemoised caller cannot spin.
    const inner = vi.fn(async (_params?: unknown) => ({ ok: true }));

    function InlineArrow() {
      const { data } = useReport(
        async params => inner(params) as never,
        { window: 30 } as never,
        true,
        'test',
      );
      return <div>{data ? 'loaded' : 'loading'}</div>;
    }

    render(<InlineArrow />);
    await screen.findByText('loaded');
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('refetches when a bound argument changes, via resourceKey', async () => {
    // The correct shape for the player-detail case: bound id, memoised on it.
    const calls: number[] = [];
    let setId: (id: number) => void = () => {};

    function BoundArg() {
      const [userId, setUserId] = useState(18);
      setId = setUserId;
      // Deliberately NOT memoised, to prove resourceKey is what drives the
      // refetch — identity no longer can, by design.
      const fetcher = async () => {
        calls.push(userId);
        return { ok: true };
      };
      const { data } = useReport(fetcher as never, { window: 30 } as never, true, 'test', String(userId));
      return <div>{data ? `loaded-${userId}` : 'loading'}</div>;
    }

    render(<BoundArg />);
    await screen.findByText('loaded-18');
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(calls).toEqual([18]);

    await act(async () => setId(19));
    await waitFor(() => expect(calls).toEqual([18, 19]));

    // And having refetched once, it settles rather than looping on the new id.
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(calls).toEqual([18, 19]);
  });
});
