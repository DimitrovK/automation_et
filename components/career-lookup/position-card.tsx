'use client';

import { AlertTriangle, Check, Loader2, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiButton } from '@/components/ui/emerald-button';
import type { PositionsTracker, SetPositionsRequest } from '@/types/player';
import { FootballerAPI } from '@/lib/footballer-api';

type PositionCardProps = {
  positionsTracker?: PositionsTracker;
  footballerId?: number | null;
  playerFoundInDB?: boolean;
  className?: string;
  onPositionsApplied?: () => void;
};

const ROLE_COLORS: Record<string, string> = {
  GK: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  DEF: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  MID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  FWD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function getRoleBadgeClass(positionName: string): string {
  const gkPositions = ['GK'];
  const defPositions = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW'];
  const midPositions = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
  const fwdPositions = ['LW', 'RW', 'CF', 'ST', 'SS'];

  if (gkPositions.includes(positionName)) return ROLE_COLORS.GK;
  if (defPositions.includes(positionName)) return ROLE_COLORS.DEF;
  if (midPositions.includes(positionName)) return ROLE_COLORS.MID;
  if (fwdPositions.includes(positionName)) return ROLE_COLORS.FWD;
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

type SyncStatus = 'synced' | 'mismatch' | 'new-player' | 'no-data';

function getSyncStatus(positionsTracker?: PositionsTracker, playerFoundInDB?: boolean): SyncStatus {
  if (!positionsTracker) return 'no-data';
  if (!playerFoundInDB) return 'new-player';
  if (positionsTracker.hasDiscrepancy) return 'mismatch';
  return 'synced';
}

const STATUS_BADGES: Record<SyncStatus, { label: string; className: string }> = {
  'synced': { label: 'Synced', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  'mismatch': { label: 'Mismatch', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  'new-player': { label: 'New Player', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  'no-data': { label: 'No Data', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

export function PositionCard({
  positionsTracker,
  footballerId,
  playerFoundInDB,
  className,
  onPositionsApplied,
}: PositionCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncStatus = getSyncStatus(positionsTracker, playerFoundInDB);
  const statusBadge = STATUS_BADGES[syncStatus];

  const handleApplyPositions = async () => {
    if (!footballerId || !positionsTracker) return;

    // Merge existing DB positions with missing ones from Wikipedia
    const existingDbIds = new Set(positionsTracker.databasePositions.map(p => p.id));
    const allPositionIds = [
      ...positionsTracker.databasePositions.map(p => p.id),
      ...positionsTracker.missingIdsToApply.filter(id => !existingDbIds.has(id)),
    ];

    // Keep existing primary if set, otherwise first position is primary
    const existingPrimary = positionsTracker.databasePositions.find(p => p.isPrimary);

    const request: SetPositionsRequest = {
      footballer_id: footballerId,
      positions: allPositionIds.map((id, index) => ({
        position_id: id,
        is_primary: existingPrimary ? id === existingPrimary.id : index === 0,
        sort_order: index,
      })),
    };

    try {
      setApplying(true);
      setError(null);
      await FootballerAPI.setPositions(request);
      setApplied(true);
      onPositionsApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply positions');
    } finally {
      setApplying(false);
    }
  };

  if (!positionsTracker) {
    return null;
  }

  const hasWikipediaPositions = positionsTracker.wikipediaPositions.length > 0;
  const hasDbPositions = positionsTracker.databaseHasPositions;
  const hasMissing = positionsTracker.missingInDatabase.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-gray-600 dark:text-gray-400" />
            <div>
              <CardTitle className="text-lg">Positions</CardTitle>
              <CardDescription>{positionsTracker.message}</CardDescription>
            </div>
          </div>
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discrepancy Alert */}
        {syncStatus === 'mismatch' && hasMissing && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{positionsTracker.missingInDatabase.length}</strong>
              {' '}
              position{positionsTracker.missingInDatabase.length > 1 ? 's' : ''}
              {' '}
              found on Wikipedia but missing in database:
              {' '}
              <strong>{positionsTracker.missingInDatabase.map(p => p.fullName).join(', ')}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Wikipedia Positions */}
        {hasWikipediaPositions && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Wikipedia Positions
            </h4>
            <div className="flex flex-wrap gap-2">
              {positionsTracker.wikipediaPositions.map(pos => {
                const isMissing = positionsTracker.missingInDatabase.some(m => m.id === pos.id);
                return (
                  <Badge
                    key={pos.id}
                    className={`${getRoleBadgeClass(pos.name)} ${isMissing ? 'ring-2 ring-amber-400' : ''}`}
                  >
                    {pos.fullName}
                    {pos.originalWikipediaName !== pos.name && (
                      <span className="ml-1 text-xs opacity-60">({pos.originalWikipediaName})</span>
                    )}
                    {isMissing && <span className="ml-1 text-xs">⚠️</span>}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Database Positions */}
        {hasDbPositions && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Database Positions
            </h4>
            <div className="flex flex-wrap gap-2">
              {positionsTracker.databasePositions.map(pos => (
                <Badge
                  key={pos.id}
                  className={getRoleBadgeClass(pos.name)}
                >
                  {pos.isPrimary && <Star className="mr-1 size-3 fill-current" />}
                  {pos.fullName}
                  {pos.isPrimary && <span className="ml-1 text-xs opacity-70">(Primary)</span>}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* No DB Positions */}
        {!hasDbPositions && playerFoundInDB && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No positions assigned in database yet.
          </div>
        )}

        {/* Apply Button */}
        {hasMissing && footballerId && !applied && (
          <ApiButton
            onClick={handleApplyPositions}
            disabled={applying}
            size="sm"
          >
            {applying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                Apply Wikipedia Positions
              </>
            )}
          </ApiButton>
        )}

        {/* Success State */}
        {applied && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            Positions applied successfully!
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            ❌ {error}
          </div>
        )}

        {/* New Player Info */}
        {syncStatus === 'new-player' && hasWikipediaPositions && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            💡 These positions will be assigned when the player is deployed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
