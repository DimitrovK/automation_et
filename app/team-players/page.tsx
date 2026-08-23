'use client';

import type { TeamHeaderInfo } from '@/types/team';
import { Users2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { RosterBrowser } from '@/components/roster/RosterBrowser';
import { TeamHeader } from '@/components/team-players/TeamHeader';
import { TeamSearch } from '@/components/team-players/TeamSearch';
import { useAuth } from '@/lib/auth';
import config from '@/lib/config';
import { TeamAPI } from '@/lib/team-api';
import { parseTeamId } from '@/lib/team-id-param';

/**
 * One club's squad, as the catalogue holds it.
 *
 * The list, its filters and its paging live in `RosterBrowser`, which the
 * nation roster uses too — a squad and a country's roster are the same stints
 * scoped differently, and the backend serves both from one view for the same
 * reason. What is left here is the part that is actually about a team: picking
 * one, and saying what it is.
 */
function TeamPlayers() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Consumed once. The URL is a starting point, not a binding — picking a
  // different team from the search box must not be undone by a re-render
  // reading the original id back out of the query string.
  const consumedTeamIdParam = useRef(false);

  const [teamId, setTeamId] = useState<number | null>(null);
  const [team, setTeam] = useState<TeamHeaderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (consumedTeamIdParam.current || !isAuthenticated) {
      return;
    }
    const fromUrl = parseTeamId(searchParams?.get('teamId'));
    if (fromUrl === null) {
      return;
    }
    consumedTeamIdParam.current = true;
    setTeamId(fromUrl);
  }, [isAuthenticated, searchParams]);

  // The browser asks for a page; this keeps the header that came back with it.
  const fetchPage = useCallback(async (id: number, params: Parameters<typeof TeamAPI.getTeamPlayers>[1]) => {
    try {
      const response = await TeamAPI.getTeamPlayers(id, params);
      setTeam(response.team);
      setError(null);
      return response.players;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to load team players';
      // A 404 here means the team id does not exist, or the backend has not
      // deployed this route yet — common between review and the prod deploy.
      throw new Error(
        /404|Not Found|Team not found/i.test(raw)
          ? `${raw}\n\nThis can mean the team id doesn't exist, or the backend at ${config.API_BASE_URL} doesn't have the team-players endpoint deployed yet (GET /data/team/<id>/players/).`
          : raw,
      );
    }
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  function handleTeamSelect(id: number) {
    setTeamId(id);
    setError(null);
    // Keep the address bar honest. Arriving by deep link and then picking a
    // different team would otherwise leave the URL naming the previous club.
    consumedTeamIdParam.current = true;
    router.replace(`/team-players?teamId=${id}`);
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-foreground">
            <Users2 className="size-7 text-emerald-600" />
            {' '}
            Team Players
          </h1>
          <p className="text-muted-foreground">
            Look up the squad assigned to a team. Search by name or paste a team ID.
          </p>
        </div>

        <TeamSearch onSelect={handleTeamSelect} onValidationError={setError} />

        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        <RosterBrowser
          subjectId={teamId}
          fetchPage={fetchPage}
          header={team ? <TeamHeader team={team} /> : null}
          nationFilterLabel="Nationality"
          onEditFootballer={id => router.push(`/footballer-management?edit=${id}`)}
        />
      </div>
    </div>
  );
}

/**
 * `useSearchParams` suspends, and a client page that reads it without a
 * boundary makes the whole route bail out of prerendering — a build error in
 * Next 16, not a runtime one.
 */
export default function TeamPlayersPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading" subtitle="Preparing team lookup..." />}>
      <TeamPlayers />
    </Suspense>
  );
}
