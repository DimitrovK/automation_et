import type { Footballer, n8nWikiPlayerData } from '@/types/player';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InternationalCareerCard } from './international-career-card';
import { PlayerProfileCard } from './player-profile-card';
import { SeniorCareerCard } from './senior-career-card';

type CareerLookupInfoProps = {
  playerData: n8nWikiPlayerData;
  dbPlayerInfo?: Footballer | null;
  chosenDataSource?: 'wikipedia' | 'database' | null;
  onDataSourceChange?: (dataSource: 'wikipedia' | 'database') => void;
  className?: string;
};

export function CareerLookupInfo({
  playerData,
  dbPlayerInfo,
  chosenDataSource,
  onDataSourceChange,
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
        <div className="lg:col-span-3">
          <SeniorCareerCard
            playerData={playerData}
            dbPlayerInfo={dbPlayerInfo}
            chosenDataSource={chosenDataSource}
            onDataSourceChange={onDataSourceChange}
          />

          <InternationalCareerCard
            nationalTeams={playerData.nationalTeams}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
