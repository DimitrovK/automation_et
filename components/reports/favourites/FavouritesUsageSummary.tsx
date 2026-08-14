'use client';

import type { FavouritesUsageResponse } from '@/types/user-hub';
import { Layers, Star, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { avgFavouritesPerUser } from '@/lib/user-hub-analytics';

type Props = {
  data: FavouritesUsageResponse;
};

/** Top-line adoption cards for the favourites-usage analytics page. */
export function FavouritesUsageSummary({ data }: Props) {
  const { users_with_favourites: withFav, total_users: total, game_popularity } = data;
  const pct = total > 0 ? Math.round((withFav / total) * 100) : 0;
  const distinctGames = Object.keys(game_popularity).length;
  const avgPerUser = avgFavouritesPerUser(data);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Star className="size-4 text-amber-500" />
            Users with favourites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight">
            {withFav.toLocaleString()}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              /
              {' '}
              {total.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {pct}
            % adoption
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="size-4 text-emerald-600" />
            Total users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight">{total.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Star className="size-4 text-amber-500" />
            Games favourited
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight">{distinctGames}</p>
          <p className="text-xs text-muted-foreground">distinct games with ≥1 favourite</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Layers className="size-4 text-emerald-600" />
            Avg per user
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight">{avgPerUser.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">favourites per user (who has any)</p>
        </CardContent>
      </Card>
    </div>
  );
}
