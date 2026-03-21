import type { Footballer, FootballerNationStat, n8nWikiPlayerData } from '@/types/player';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InternationalCareerCard } from './international-career-card';
import { PlayerProfileCard } from './player-profile-card';
import type { SelectedPosition } from './position-card';
import { PositionCard } from './position-card';
import { SeniorCareerCard } from './senior-career-card';

type CareerLookupInfoProps = {
  playerData: n8nWikiPlayerData;
  dbPlayerInfo?: Footballer | null;
  dbNationalTeams?: FootballerNationStat[];
  chosenDataSource?: 'wikipedia' | 'database' | null;
  onDataSourceChange?: (dataSource: 'wikipedia' | 'database') => void;
  onNationStatsUpdated?: () => void;
  onSelectedPositionsChange?: (positions: SelectedPosition[]) => void;
  className?: string;
};

export function CareerLookupInfo({
  playerData,
  dbPlayerInfo,
  dbNationalTeams,
  chosenDataSource,
  onDataSourceChange,
  onNationStatsUpdated,
  onSelectedPositionsChange,
  className,
}: CareerLookupInfoProps) {
  return (
    <TooltipProvider>
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-4 ${className}`}>
        {/* Left Sidebar - Player Profile */}
        <div className="space-y-4 lg:col-span-1">
          <PlayerProfileCard
            playerData={playerData}
            dbPlayerInfo={dbPlayerInfo}
            chosenDataSource={chosenDataSource}
          />
        </div>

        {/* Right Content - Career History */}
        <div className="space-y-6 lg:col-span-3">
          <SeniorCareerCard
            playerData={playerData}
            dbPlayerInfo={dbPlayerInfo}
            chosenDataSource={chosenDataSource}
            onDataSourceChange={onDataSourceChange}
          />

          <InternationalCareerCard
            nationalTeams={playerData.nationalTeams}
            dbNationalTeams={dbNationalTeams}
            footballerId={dbPlayerInfo?.id ?? null}
            onNationStatsUpdated={onNationStatsUpdated}
          />

          <PositionCard
            positionsTracker={playerData.positionsTracker}
            footballerId={dbPlayerInfo?.id ?? null}
            playerFoundInDB={playerData.playerFoundInDB}
            onSelectedPositionsChange={onSelectedPositionsChange}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
