import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PositionCard } from '@/components/career-lookup/position-card';
import type { PositionsTracker } from '@/types/player';

// Mock FootballerAPI
vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    setPositions: vi.fn(),
  },
}));

import { FootballerAPI } from '@/lib/footballer-api';

const mockSetPositions = vi.mocked(FootballerAPI.setPositions);

const makeTracker = (overrides: Partial<PositionsTracker> = {}): PositionsTracker => ({
  hasDiscrepancy: false,
  databasePositions: [],
  databaseHasPositions: false,
  wikipediaPositions: [],
  missingInDatabase: [],
  missingIdsToApply: [],
  message: 'No positions data',
  ...overrides,
});

describe('PositionCard', () => {
  beforeEach(() => {
    mockSetPositions.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when no positionsTracker provided', () => {
    const { container } = render(<PositionCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Wikipedia positions with role badges', () => {
    const tracker = makeTracker({
      wikipediaPositions: [
        { id: 1, name: 'GK', fullName: 'Goalkeeper', originalWikipediaName: 'Goalkeeper' },
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      message: '2 positions found',
    });

    render(<PositionCard positionsTracker={tracker} />);

    expect(screen.getByText('Goalkeeper')).toBeInTheDocument();
    expect(screen.getByText('Striker')).toBeInTheDocument();
    expect(screen.getByText('2 positions found')).toBeInTheDocument();
  });

  it('renders DB positions with primary star badge', () => {
    const tracker = makeTracker({
      databasePositions: [
        { id: 16, name: 'ST', fullName: 'Striker', isPrimary: true },
        { id: 5, name: 'CF', fullName: 'Centre-Forward', isPrimary: false },
      ],
      databaseHasPositions: true,
      message: 'Positions synced',
    });

    render(<PositionCard positionsTracker={tracker} playerFoundInDB />);

    expect(screen.getByText('(Primary)')).toBeInTheDocument();
    expect(screen.getByText('Centre-Forward')).toBeInTheDocument();
  });

  it('shows Synced badge when no discrepancy', () => {
    const tracker = makeTracker({
      databaseHasPositions: true,
      databasePositions: [{ id: 1, name: 'GK', fullName: 'Goalkeeper', isPrimary: true }],
      wikipediaPositions: [{ id: 1, name: 'GK', fullName: 'Goalkeeper', originalWikipediaName: 'Goalkeeper' }],
      message: 'Positions match',
    });

    render(<PositionCard positionsTracker={tracker} playerFoundInDB />);

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('shows Mismatch badge and alert when discrepancy exists', () => {
    const tracker = makeTracker({
      hasDiscrepancy: true,
      databasePositions: [{ id: 1, name: 'GK', fullName: 'Goalkeeper', isPrimary: true }],
      databaseHasPositions: true,
      wikipediaPositions: [
        { id: 1, name: 'GK', fullName: 'Goalkeeper', originalWikipediaName: 'Goalkeeper' },
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      missingInDatabase: [{ id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' }],
      missingIdsToApply: [16],
      message: '1 position missing',
    });

    render(<PositionCard positionsTracker={tracker} playerFoundInDB footballerId={42} />);

    expect(screen.getByText('Mismatch')).toBeInTheDocument();
    expect(screen.getByText(/missing in database/i)).toBeInTheDocument();
    expect(screen.getByText('Apply Wikipedia Positions')).toBeInTheDocument();
  });

  it('shows New Player badge for players not in DB', () => {
    const tracker = makeTracker({
      wikipediaPositions: [
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      missingIdsToApply: [16],
      message: 'New player! 1 position found',
    });

    render(<PositionCard positionsTracker={tracker} playerFoundInDB={false} />);

    expect(screen.getByText('New Player')).toBeInTheDocument();
    expect(screen.getByText(/will be assigned when the player is deployed/i)).toBeInTheDocument();
  });

  it('calls setPositions API when Apply button clicked', async () => {
    const user = userEvent.setup();
    const onApplied = vi.fn();

    mockSetPositions.mockResolvedValue([
      {
        id: 10, footballer_id: 42, footballer_name: 'Test',
        position_id: 16, position_name: 'ST', position_full_name: 'Striker',
        position_role: 'FWD', is_primary: true, sort_order: 0,
        created_at: '', updated_at: '',
      },
    ]);

    const tracker = makeTracker({
      hasDiscrepancy: true,
      databasePositions: [],
      databaseHasPositions: false,
      wikipediaPositions: [
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      missingInDatabase: [{ id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' }],
      missingIdsToApply: [16],
      message: '1 position missing',
    });

    render(
      <PositionCard
        positionsTracker={tracker}
        playerFoundInDB
        footballerId={42}
        onPositionsApplied={onApplied}
      />,
    );

    await user.click(screen.getByText('Apply Wikipedia Positions'));

    expect(mockSetPositions).toHaveBeenCalledWith({
      footballer_id: 42,
      positions: [{ position_id: 16, is_primary: true, sort_order: 0 }],
    });
    expect(await screen.findByText(/applied successfully/i)).toBeInTheDocument();
    expect(onApplied).toHaveBeenCalled();
  });

  it('shows error state when API call fails', async () => {
    const user = userEvent.setup();
    mockSetPositions.mockRejectedValue(new Error('Network error'));

    const tracker = makeTracker({
      hasDiscrepancy: true,
      missingInDatabase: [{ id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' }],
      missingIdsToApply: [16],
      message: '1 position missing',
    });

    render(<PositionCard positionsTracker={tracker} playerFoundInDB footballerId={42} />);

    await user.click(screen.getByText('Apply Wikipedia Positions'));

    expect(await screen.findByText(/Network error/i)).toBeInTheDocument();
  });

  it('shows original Wikipedia name when different from matched name', () => {
    const tracker = makeTracker({
      wikipediaPositions: [
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      message: '1 position found',
    });

    render(<PositionCard positionsTracker={tracker} />);

    expect(screen.getByText('(Forward)')).toBeInTheDocument();
  });
});
