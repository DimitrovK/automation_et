import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataPagination } from '@/components/ui/data-pagination';

describe('DataPagination', () => {
  afterEach(cleanup);

  it('renders nothing when there are zero or one page and no count', () => {
    const { container } = render(
      <DataPagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a single-line caption when there is one page and a count', () => {
    render(
      <DataPagination
        currentPage={1}
        totalPages={1}
        totalCount={3}
        visibleCount={3}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Showing 3 results/)).toBeInTheDocument();
  });

  it('renders Prev / page numbers / Next when there are multiple pages', () => {
    render(
      <DataPagination
        currentPage={2}
        totalPages={5}
        totalCount={250}
        visibleCount={50}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByText('Showing 50 of 250 results')).toBeInTheDocument();
    // All pages 1..5 fit in the window — no ellipsis expected.
    expect(screen.queryByText('More pages')).not.toBeInTheDocument();
    for (const n of ['1', '2', '3', '4', '5']) {
      expect(screen.getByText(n, { selector: 'a' })).toBeInTheDocument();
    }
  });

  it('shows leading + trailing ellipses for big page counts', () => {
    render(
      <DataPagination currentPage={50} totalPages={100} onPageChange={vi.fn()} hideCount />,
    );

    // Window centered on 50: pages 48-52, plus first (1) and last (100)
    // with ellipses on both sides.
    expect(screen.getByText('1', { selector: 'a' })).toBeInTheDocument();
    expect(screen.getByText('50', { selector: 'a' })).toBeInTheDocument();
    expect(screen.getByText('100', { selector: 'a' })).toBeInTheDocument();
    // Two ellipses
    expect(screen.getAllByText(/More pages/).length).toBe(2);
  });

  it('marks the current page as active', () => {
    render(
      <DataPagination currentPage={3} totalPages={5} onPageChange={vi.fn()} hideCount />,
    );
    const active = screen.getByText('3', { selector: 'a' });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('clicking a page number calls onPageChange with that number', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataPagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
        hideCount
      />,
    );

    await user.click(screen.getByText('3', { selector: 'a' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('clicking the same page does not fire onPageChange', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataPagination
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
        hideCount
      />,
    );

    await user.click(screen.getByText('3', { selector: 'a' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('Prev / Next buttons advance the page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataPagination
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
        hideCount
      />,
    );

    await user.click(screen.getByLabelText('Go to next page'));
    expect(onPageChange).toHaveBeenLastCalledWith(4);

    await user.click(screen.getByLabelText('Go to previous page'));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('Prev is disabled on page 1 and Next is disabled on the last page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    const { rerender } = render(
      <DataPagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
        hideCount
      />,
    );
    await user.click(screen.getByLabelText('Go to previous page'));
    expect(onPageChange).not.toHaveBeenCalled();

    rerender(
      <DataPagination
        currentPage={5}
        totalPages={5}
        onPageChange={onPageChange}
        hideCount
      />,
    );
    await user.click(screen.getByLabelText('Go to next page'));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('disabled prop blocks all navigation', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataPagination
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
        disabled
        hideCount
      />,
    );

    await user.click(screen.getByLabelText('Go to next page'));
    await user.click(screen.getByText('1', { selector: 'a' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
