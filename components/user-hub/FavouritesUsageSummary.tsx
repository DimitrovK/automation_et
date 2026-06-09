'use client';

import type { FavouritesUsageResponse } from '@/types/user-hub';
import { Star, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  data: FavouritesUsageResponse;
};

/** Top-line adoption cards for the favourites-usage analytics page. */
export function FavouritesUsageSummary({ data }: Props) {
  const { users_with_favourites: withFav, total_users: total, game_popularity } = data;
  const pct = total > 0 ? Math.round((withFav / total) * 100) : 0;
  const distinctGames = Object.keys(game_popularity).length;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Star className="size-4 text-amber-500" />
            Users with favourites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {withFav.toLocaleString()}
            <span className="ml-1 text-base font-normal text-gray-500">
              /
              {' '}
              {total.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            {pct}
            % adoption
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Users className="size-4 text-emerald-600" />
            Total users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Star className="size-4 text-amber-500" />
            Games favourited
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{distinctGames}</p>
          <p className="text-xs text-gray-500">distinct games with ≥1 favourite</p>
        </CardContent>
      </Card>
    </div>
  );
}
