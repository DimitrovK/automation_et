import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Command, CommandItem, CommandList } from '@/components/ui/command';

describe('commandItem', () => {
  it('highlights the selected item with a background, not only a text colour', () => {
    // The variant was written `data-[selected='true']:bg-accent` — quoted — and
    // Tailwind emitted `[data-selected="'true'"]`, a selector matching the
    // literal string `'true'` with its apostrophes. It never matched anything.
    //
    // cmdk sets `data-selected` on the item under the keyboard cursor AND on
    // hover, so one typo made the arrow keys look dead, the hover look dead,
    // and the current item invisible in every combobox in the app.
    const { container } = render(
      <Command>
        <CommandList>
          <CommandItem value="england">England</CommandItem>
        </CommandList>
      </Command>,
    );
    const item = container.querySelector('[cmdk-item]');

    expect(item?.className).toContain('data-[selected=true]:bg-accent');
    expect(item?.className).not.toContain('data-[selected=\'true\']');
  });
});
