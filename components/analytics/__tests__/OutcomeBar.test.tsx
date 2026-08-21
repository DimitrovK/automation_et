import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OutcomeBar } from '@/components/analytics/OutcomeBar';

const outcome = { solved_unaided: 12, solved_helped: 4, unsolved: 3, unfinished: 1 };

describe('outcomeBar', () => {
  it('draws every segment in proportion to its share of the plays', () => {
    const { container } = render(<OutcomeBar outcome={outcome} plays={20} />);
    const widths = [...container.querySelectorAll<HTMLElement>('[data-segment]')]
      .map(node => node.style.width);

    expect(widths).toEqual(['60%', '20%', '15%', '5%']);
  });

  it('says the whole story in words, because a bar is not readable to everyone', () => {
    // The row already carries the rates as numbers; what the bar adds is the
    // shape. A screen reader gets the shape as a sentence.
    render(<OutcomeBar outcome={outcome} plays={20} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      '20 plays: 12 solved unaided, 4 solved after help, 3 unsolved, 1 left unfinished',
    );
  });

  it('omits a segment nobody landed in rather than drawing a sliver', () => {
    const { container } = render(
      <OutcomeBar outcome={{ ...outcome, unfinished: 0 }} plays={19} />,
    );

    expect(container.querySelectorAll('[data-segment]')).toHaveLength(3);
  });

  it('renders nothing when there are no plays to describe', () => {
    // Not an empty bar: an empty track reads as "everything failed" at a glance,
    // which is the opposite of "nobody played this".
    const { container } = render(
      <OutcomeBar outcome={{ solved_unaided: 0, solved_helped: 0, unsolved: 0, unfinished: 0 }} plays={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
