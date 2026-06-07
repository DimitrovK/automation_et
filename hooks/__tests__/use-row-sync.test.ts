import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRowSync } from '@/hooks/use-row-sync';

describe('useRowSync', () => {
  it('starts with no status, no errors, syncingAll=false', () => {
    const { result } = renderHook(() => useRowSync<number>());

    expect(result.current.status).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.syncingAll).toBe(false);
    expect(result.current.isPending(1)).toBe(false);
  });

  it('marks the row loading then success on a resolving op', async () => {
    const { result } = renderHook(() => useRowSync<number>());

    let resolve!: () => void;
    const op = new Promise<void>((res) => {
      resolve = res;
    });

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.run(7, () => op);
    });

    expect(result.current.status[7]).toBe('loading');
    expect(result.current.isPending(7)).toBe(true);

    await act(async () => {
      resolve();
      await runPromise;
    });

    expect(result.current.status[7]).toBe('success');
    expect(result.current.errors[7]).toBeUndefined();
    expect(result.current.isPending(7)).toBe(false);
  });

  it('marks error and surfaces the Error message on rejection', async () => {
    const { result } = renderHook(() => useRowSync<number>());

    await act(async () => {
      await expect(
        result.current.run(5, async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
    });

    expect(result.current.status[5]).toBe('error');
    expect(result.current.errors[5]).toBe('boom');
  });

  it('uses the fallback message when the thrown value is not an Error', async () => {
    const { result } = renderHook(() => useRowSync<number>());

    // Intentionally throwing a literal to exercise the fallback path;
    // production code that throws non-Errors is rare but possible.
    const throwsLiteral = async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'opaque';
    };

    await act(async () => {
      await expect(
        result.current.run(3, throwsLiteral, 'Default failure'),
      ).rejects.toBeDefined();
    });

    expect(result.current.errors[3]).toBe('Default failure');
  });

  it('clears the previous error when a row is retried', async () => {
    const { result } = renderHook(() => useRowSync<number>());

    await act(async () => {
      await expect(result.current.run(1, async () => {
        throw new Error('first');
      })).rejects.toThrow();
    });

    expect(result.current.errors[1]).toBe('first');

    await act(async () => {
      await result.current.run(1, async () => { /* succeed */ });
    });

    expect(result.current.status[1]).toBe('success');
    expect(result.current.errors[1]).toBeUndefined();
  });

  it('runAll sets syncingAll true for the duration and clears it after', async () => {
    const { result } = renderHook(() => useRowSync<number>());

    const order: string[] = [];
    const ops = [
      async () => {
        order.push('a');
      },
      async () => {
        order.push('b');
      },
    ];

    let runAllPromise!: Promise<void>;
    act(() => {
      runAllPromise = result.current.runAll(ops);
    });

    expect(result.current.syncingAll).toBe(true);

    await act(async () => {
      await runAllPromise;
    });

    expect(result.current.syncingAll).toBe(false);
    // Sequential — order matches the input array.
    expect(order).toEqual(['a', 'b']);
  });

  it('runAll keeps going after a single op fails (one bad row does not stop the batch)', async () => {
    const { result } = renderHook(() => useRowSync<number>());

    const order: string[] = [];
    const ops = [
      async () => {
        order.push('a');
        await result.current.run(1, async () => { /* ok */ });
      },
      async () => {
        order.push('b');
        await result.current.run(2, async () => {
          throw new Error('row b failed');
        });
      },
      async () => {
        order.push('c');
        await result.current.run(3, async () => { /* ok */ });
      },
    ];

    await act(async () => {
      await result.current.runAll(ops);
    });

    expect(order).toEqual(['a', 'b', 'c']);
    expect(result.current.status[1]).toBe('success');
    expect(result.current.status[2]).toBe('error');
    expect(result.current.status[3]).toBe('success');
    expect(result.current.syncingAll).toBe(false);
  });
});
