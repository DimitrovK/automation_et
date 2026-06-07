import type { FootballerNationStat, NationalTeam } from '@/types/player';
import { cleanup, render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InternationalCareerCard } from '@/components/career-lookup/international-career-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FootballerAPI } from '@/lib/footballer-api';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    createFootballerNation: vi.fn(),
    updateFootballerNation: vi.fn(),
  },
}));

const mockCreate = vi.mocked(FootballerAPI.createFootballerNation);
const mockUpdate = vi.mocked(FootballerAPI.updateFootballerNation);

// Smoke tests: the only reason this file exists is the useRowSync /
// RowSyncButton refactor. We want signal that the existing public surface
// still calls the same API methods with the same payloads.
function render(ui: React.ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

const makeNation = (overrides: Partial<NationalTeam> = {}): NationalTeam => ({
  teamName: 'England',
  startYear: 2010,
  endYear: 2020,
  apps: 50,
  goals: 10,
  nationFound: true,
  nationID: 1,
  nationNameDB: null,
  ...overrides,
});

const makeDbStat = (overrides: Partial<FootballerNationStat> = {}): FootballerNationStat => ({
  id: 100,
  footballer_id: 99,
  footballer_name: 'Test',
  nation_id: 1,
  nation_name: 'England',
  apps: 50,
  goals: 10,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('InternationalCareerCard — post-refactor smoke', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  afterEach(() => cleanup());

  it('still calls createFootballerNation with the wiki values on "Add to DB"', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue(makeDbStat());

    render(
      <InternationalCareerCard
        nationalTeams={[makeNation()]}
        dbNationalTeams={[]} /* nation not yet in DB → "Add" */
        footballerId={99}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Add to DB/i }));

    expect(mockCreate).toHaveBeenCalledWith({
      footballer_id: 99,
      nation_id: 1,
      apps: 50,
      goals: 10,
    });
  });

  it('still calls updateFootballerNation with the wiki values on "Update in DB"', async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue(makeDbStat({ apps: 60 }));

    render(
      <InternationalCareerCard
        nationalTeams={[makeNation({ apps: 60 })]}
        dbNationalTeams={[makeDbStat({ apps: 50 })]} /* mismatch → "Update" */
        footballerId={99}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Update in DB/i }));

    expect(mockUpdate).toHaveBeenCalledWith(100, {
      footballer_id: 99,
      nation_id: 1,
      apps: 60,
      goals: 10,
    });
  });

  it('shows Synced badge when wiki and DB match', () => {
    render(
      <InternationalCareerCard
        nationalTeams={[makeNation()]}
        dbNationalTeams={[makeDbStat()]}
        footballerId={99}
      />,
    );

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });
});
