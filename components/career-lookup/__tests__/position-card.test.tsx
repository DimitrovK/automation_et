import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PositionCard } from '@/components/career-lookup/position-card';
import type { PositionsTracker } from '@/types/player';

// Mock FootballerAPI
vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    setPositions: vi.fn(),
    getPositions: vi.fn().mockResolvedValue([]),
  },
}));

import { FootballerAPI } from '@/lib/footballer-api';

const mockSetPositions = vi.mocked(FootballerAPI.setPositions);
const mockGetPositions = vi.mocked(FootballerAPI.getPositions);

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
    mockGetPositions.mockReset();
    mockGetPositions.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when no positionsTracker provided', () => {
    const { container } = render(<PositionCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders selected positions from Wikipedia data', () => {
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

    expect(screen.getByText('Primary')).toBeInTheDocument();
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

  it('calls setPositions API when Save button clicked for unsaved positions', async () => {
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

    await user.click(screen.getByText('Save Positions'));

    expect(mockSetPositions).toHaveBeenCalledWith({
      footballer_id: 42,
      positions: [{ position_id: 16, is_primary: true, sort_order: 0 }],
    });
    expect(await screen.findByText(/saved successfully/i)).toBeInTheDocument();
    expect(onApplied).toHaveBeenCalled();
  });

  it('shows error state when API call fails', async () => {
    const user = userEvent.setup();
    mockSetPositions.mockRejectedValue(new Error('Network error'));

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

    render(<PositionCard positionsTracker={tracker} playerFoundInDB footballerId={42} />);

    await user.click(screen.getByText('Save Positions'));

    expect(await screen.findByText(/Network error/i)).toBeInTheDocument();
  });

  it('shows Wiki badge for positions from Wikipedia not yet in DB', () => {
    const tracker = makeTracker({
      databasePositions: [],
      databaseHasPositions: false,
      wikipediaPositions: [
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      message: '1 position found',
    });

    render(<PositionCard positionsTracker={tracker} />);

    expect(screen.getByText('Wiki')).toBeInTheDocument();
  });

  it('has tabs for Selected Positions and All Positions', () => {
    const tracker = makeTracker({
      wikipediaPositions: [
        { id: 1, name: 'GK', fullName: 'Goalkeeper', originalWikipediaName: 'Goalkeeper' },
      ],
      message: 'Test',
    });

    render(<PositionCard positionsTracker={tracker} />);

    expect(screen.getByRole('tab', { name: /Selected Positions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /All Positions/i })).toBeInTheDocument();
  });

  it('shows Unsaved badge when positions differ from DB state', () => {
    const tracker = makeTracker({
      databasePositions: [],
      databaseHasPositions: false,
      wikipediaPositions: [
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      message: 'Test',
    });

    render(<PositionCard positionsTracker={tracker} playerFoundInDB footballerId={42} />);

    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('calls onSelectedPositionsChange when positions initialize', async () => {
    const onChange = vi.fn();
    const tracker = makeTracker({
      wikipediaPositions: [
        { id: 16, name: 'ST', fullName: 'Striker', originalWikipediaName: 'Forward' },
      ],
      message: 'Test',
    });

    render(
      <PositionCard
        positionsTracker={tracker}
        onSelectedPositionsChange={onChange}
      />,
    );

    // useEffect should fire and call onChange with the wikipedia positions
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          position_id: 16,
          name: 'ST',
          is_primary: true,
        }),
      ]),
    );
  });
});
