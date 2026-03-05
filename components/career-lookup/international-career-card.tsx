import type { n8nWikiPlayerData } from '@/types/player';
import { AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type InternationalCareerCardProps = {
  nationalTeams?: n8nWikiPlayerData['nationalTeams'];
};

export function InternationalCareerCard({ nationalTeams }: InternationalCareerCardProps) {
  if (!nationalTeams || nationalTeams.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-600" />
            International Career
          </CardTitle>
          <CardDescription>
            National team appearances and statistics
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Read-only (integration coming soon)
            </span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Nation
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Apps
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Goals
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Season
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {nationalTeams.map(nt => (
                <tr
                  key={`nt-${nt.teamName}`}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700/50 ${
                    !nt.nationFound
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : ''
                  }`}
                >
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div
                          className={`font-medium ${!nt.nationFound ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'} flex items-center gap-1`}
                        >
                          {!nt.nationFound && <AlertTriangle className="size-4 text-red-500" />}
                          {nt.teamName}
                        </div>
                        {nt.nationFound && nt.nationNameDB && nt.nationNameDB !== nt.teamName && (
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Name in DB:
                            {' '}
                            {nt.nationNameDB}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="font-medium text-gray-900 dark:text-white">{nt.apps}</div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="font-medium text-gray-900 dark:text-white">{nt.goals}</div>
                  </td>
                  <td className="px-2 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {`${nt.startYear}${nt.endYear ? `–${nt.endYear}` : ''}`}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-1">
                      {nt.nationFound
                        ? (
                            <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                              Found in DB
                            </Badge>
                          )
                        : (
                            <Badge variant="destructive" className="border-red-200 bg-red-100 text-red-800">
                              <AlertTriangle className="mr-1 size-3" />
                              Not found in DB
                            </Badge>
                          )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/30">
                <td className="px-2 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  {`${nationalTeams.length} nation${nationalTeams.length !== 1 ? 's' : ''}`}
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                  {nationalTeams.reduce((sum, nt) => sum + nt.apps, 0)}
                </td>
                <td className="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white">
                  {nationalTeams.reduce((sum, nt) => sum + nt.goals, 0)}
                </td>
                <td className="px-2 py-3 font-semibold text-gray-900 dark:text-white">Total</td>
                <td className="px-2 py-3">
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                      {nationalTeams.filter(nt => nt.nationFound).length}
                      {' '}
                      found
                    </Badge>
                    {nationalTeams.filter(nt => !nt.nationFound).length > 0 && (
                      <Badge variant="destructive" className="bg-red-100 text-xs text-red-800">
                        <AlertTriangle className="mr-1 size-3" />
                        {nationalTeams.filter(nt => !nt.nationFound).length}
                        {' '}
                        missing
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
