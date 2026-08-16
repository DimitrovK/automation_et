import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CappedList } from '@/components/reports/primitives/CappedList';

describe('cappedList', () => {
  it('reports the real total, not the number of rows shown', () => {
    // The whole point: `items` is capped server-side, so a UI that counted the
    // rows it received would describe a 101-nation gap as ten.
    render(
      <CappedList total={101} shown={10} emptyLabel="none" onExpand={vi.fn()}>
        <ul />
      </CappedList>,
    );

    expect(screen.getByText('Showing 10 of 101')).toBeInTheDocument();
  });

  it('says nothing about counts when the sample IS the total', () => {
    // "Showing 10 of 10" is noise.
    render(
      <CappedList total={10} shown={10} emptyLabel="none" onExpand={vi.fn()}>
        <ul />
      </CappedList>,
    );

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('treats an empty gap list as good news, not as missing data', () => {
    render(
      <CappedList total={0} shown={0} emptyLabel="Every nation has a footballer.">
        <ul data-testid="rows" />
      </CappedList>,
    );

    expect(screen.getByText('Every nation has a footballer.')).toBeInTheDocument();
    expect(screen.queryByTestId('rows')).not.toBeInTheDocument();
  });

  it('offers only the rows that actually remain', () => {
    render(
      <CappedList total={14} shown={10} emptyLabel="none" onExpand={vi.fn()}>
        <ul />
      </CappedList>,
    );

    expect(screen.getByRole('button', { name: 'Show 4 more' })).toBeInTheDocument();
  });

  it('asks the server for more rather than revealing hidden ones', () => {
    // There are no hidden rows to reveal — the server sent ten.
    const onExpand = vi.fn();
    render(
      <CappedList total={101} shown={10} emptyLabel="none" onExpand={onExpand}>
        <ul />
      </CappedList>,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('drops the button once expanded, keeping the count', () => {
    render(
      <CappedList total={101} shown={100} expanded emptyLabel="none" onExpand={vi.fn()}>
        <ul />
      </CappedList>,
    );

    expect(screen.getByText('Showing 100 of 101')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
