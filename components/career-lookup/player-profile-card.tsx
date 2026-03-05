import type { Footballer, n8nWikiPlayerData } from '@/types/player';
import { AlertTriangle, Calendar, ExternalLink, MapPin, Search, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import config from '@/lib/config';

type PlayerProfileCardProps = {
  playerData: n8nWikiPlayerData;
  dbPlayerInfo?: Footballer | null;
  chosenDataSource?: 'wikipedia' | 'database' | null;
};

export function PlayerProfileCard({
  playerData,
  dbPlayerInfo,
  chosenDataSource,
}: PlayerProfileCardProps) {
  // Calculate age directly from playerData.dateOfBirth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Parse player name from playerData
  const parsePlayerName = (fullName: string) => {
    const nameParts = fullName.replace(/_/g, ' ').split(' ');
    if (nameParts.length >= 2) {
      const first = nameParts[0];
      const last = nameParts.slice(1).join(' ');
      return { first, last };
    }
    return { first: '', last: fullName.replace(/_/g, ' ') };
  };

  // Check for specific field conflicts (only for players in DB)
  const getFieldConflicts = () => {
    if (!playerData.playerFoundInDB || !dbPlayerInfo) {
      return {};
    }

    const { first, last } = parsePlayerName(playerData.playerName);
    return {
      name: first !== dbPlayerInfo.first_name || last !== dbPlayerInfo.last_name,
      dateOfBirth: playerData.dateOfBirth !== dbPlayerInfo.date_of_birth,
      nationality: playerData.birthCountry !== dbPlayerInfo.nation.name,
    };
  };

  // Get display value based on chosen data source (only applies to players in DB with conflicts)
  const getDisplayValue = (field: 'name' | 'dateOfBirth' | 'nationality') => {
    const conflicts = getFieldConflicts();

    // No conflicts or not in DB - use Wikipedia data
    if (!playerData.playerFoundInDB || !dbPlayerInfo || !conflicts[field]) {
      const { first, last } = parsePlayerName(playerData.playerName);
      return {
        name: `${first} ${last}`.trim(),
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
      }[field];
    }

    // There's a conflict - use chosen data source or default to Wikipedia
    if (chosenDataSource === 'database') {
      return {
        name: `${dbPlayerInfo.first_name} ${dbPlayerInfo.last_name}`.trim(),
        dateOfBirth: dbPlayerInfo.date_of_birth,
        nationality: dbPlayerInfo.nation.name,
      }[field];
    } else {
      const { first, last } = parsePlayerName(playerData.playerName);
      return {
        name: `${first} ${last}`.trim(),
        dateOfBirth: playerData.dateOfBirth,
        nationality: playerData.birthCountry,
      }[field];
    }
  };

  // Helper to render conflict indicator badge
  const renderConflictBadge = (field: 'name' | 'dateOfBirth' | 'nationality') => {
    const conflicts = getFieldConflicts();
    if (!conflicts[field]) {
      return null;
    }

    return (
      <Badge
        variant="outline"
        className={`ml-2 text-xs ${
          chosenDataSource === 'database'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-blue-300 bg-blue-50 text-blue-700'
        }`}
      >
        {chosenDataSource === 'database'
          ? (
              <>
                <Shield className="mr-1 size-3" />
                Using DB
              </>
            )
          : (
              <>
                <Search className="mr-1 size-3" />
                Using Wiki
              </>
            )}
      </Badge>
    );
  };

  const getCountryAdminLink = (playerData: n8nWikiPlayerData) => {
    if (!playerData.countryFoundInDB || !playerData.countryID) {
      return null;
    }
    return config.getAdminUrl(`FootballData/nation/${playerData.countryID}/change/`);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          {getDisplayValue('name')}
          {!playerData.playerFoundInDB && <AlertTriangle className="size-5 text-amber-500" />}
          {renderConflictBadge('name')}
        </CardTitle>
        <div className="flex flex-wrap justify-center gap-2">
          {!playerData.playerFoundInDB && (
            <Badge variant="destructive" className="border-amber-300 bg-amber-100 text-amber-800">
              <AlertTriangle className="mr-1 size-3" />
              Not in Database
            </Badge>
          )}
          {playerData.playerFoundInDB && dbPlayerInfo && chosenDataSource && (
            <Badge
              variant="secondary"
              className={chosenDataSource === 'database'
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                : 'border-blue-300 bg-blue-100 text-blue-800'}
            >
              {chosenDataSource === 'database'
                ? (
                    <>
                      <Shield className="mr-1 size-3" />
                      Database Data Active
                    </>
                  )
                : (
                    <>
                      <Search className="mr-1 size-3" />
                      Wikipedia Data Active
                    </>
                  )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="size-4 shrink-0 text-gray-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Age</p>
              <div className="flex items-center">
                <p className="text-sm font-medium dark:text-white">
                  {calculateAge(getDisplayValue('dateOfBirth') as string)}
                  {' '}
                  (
                  {getDisplayValue('dateOfBirth')}
                  )
                </p>
                {renderConflictBadge('dateOfBirth')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-gray-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nationality</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium dark:text-white">{getDisplayValue('nationality')}</p>
                {renderConflictBadge('nationality')}
                {!playerData.countryFoundInDB && <AlertTriangle className="size-4 text-amber-500" />}
              </div>
              {!playerData.countryFoundInDB && (
                <Badge
                  variant="destructive"
                  className="mt-1 border-amber-300 bg-amber-100 text-xs text-amber-800"
                >
                  <AlertTriangle className="mr-1 size-3" />
                  Not in Database
                </Badge>
              )}
              {getCountryAdminLink(playerData) && (
                <a
                  href={getCountryAdminLink(playerData)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                >
                  Edit Country
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="size-4 shrink-0 text-gray-500" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Position</p>
              <p className="text-sm font-medium dark:text-white">{playerData.position}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
