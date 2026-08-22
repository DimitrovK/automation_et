'use client';

import type { NationHeaderInfo } from '@/types/team';
import { Globe2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { NationHeader } from '@/components/roster/NationHeader';
import { RosterBrowser } from '@/components/roster/RosterBrowser';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { TeamAPI } from '@/lib/team-api';
import { parsePositiveIntParam } from '@/lib/url-params';

/**
 * Everyone who played for a club in one country.
 *
 * A different question from everyone FROM it, and the one a club-based game
 * asks: Career Path and Grid build from club history, so Brazilian depth does
 * not help content set in Brazil. The footballers analytics page links here
 * from its by-country matrix.
 *
 * The list is `RosterBrowser`, shared with the team squad — same stints, scoped
 * differently, exactly as the backend serves them. What is here is choosing a
 * country and saying what it holds.
 */
function NationPlayers() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumedNationParam = useRef(false);

  const [nationId, setNationId] = useState<number | null>(null);
  const [nation, setNation] = useState<NationHeaderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (consumedNationParam.current || !isAuthenticated) {
      return;
    }
    const fromUrl = parsePositiveIntParam(searchParams?.get('nationId'));
    if (fromUrl === null) {
      return;
    }
    consumedNationParam.current = true;
    setNationId(fromUrl);
  }, [isAuthenticated, searchParams]);

  const fetchPage = useCallback(async (id: number, params: Parameters<typeof TeamAPI.getNationPlayers>[1]) => {
    const response = await TeamAPI.getNationPlayers(id, params);
    setNation(response.nation);
    setError(null);
    return response.players;
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  function handleNationSelect(id: number | null) {
    setNationId(id);
    setNation(null);
    setError(null);
    if (id !== null) {
      consumedNationParam.current = true;
      router.replace(`/nation-players?nationId=${id}`);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-foreground">
            <Globe2 className="size-7 text-emerald-600" />
            {' '}
            Nation Players
          </h1>
          <p className="text-muted-foreground">
            Everyone who played for a club in a country — not everyone from it. Cross it
            with a nationality below for "Brazilians who played in England".
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Country played in
            </span>
            <NationCombobox value={nationId} onChange={handleNationSelect} />
          </CardContent>
        </Card>

        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {nationId === null && (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Pick a country, or arrive here from the footballers analytics table.
          </p>
        )}

        <RosterBrowser
          subjectId={nationId}
          fetchPage={fetchPage}
          header={nation ? <NationHeader nation={nation} /> : null}
          nationFilterLabel="Nationality (of the footballer)"
          emptyLabel="No spell in this country matches the current filters."
          onEditFootballer={id => router.push(`/footballer-management?edit=${id}`)}
        />
      </div>
    </div>
  );
}

export default function NationPlayersPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading" subtitle="Preparing nation lookup..." />}>
      <NationPlayers />
    </Suspense>
  );
}
