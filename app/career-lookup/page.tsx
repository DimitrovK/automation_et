'use client';

import type React from 'react';
import type { Footballer, n8nWikiPlayerData } from '@/types/player';
import {
  AlertCircle,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CareerLookupDataValidation } from '@/components/career-lookup/career-lookup-data-validation';
import { CareerLookupInfo } from '@/components/career-lookup/career-lookup-info';
import { CareerLookupPlayerConfiguration } from '@/components/career-lookup/career-lookup-player-configuration';
import { CareerLookupSearch } from '@/components/career-lookup/career-lookup-search';
import { ConnectionSettings } from '@/components/career-lookup/connection-settings';
import { HelpDialog } from '@/components/career-lookup/help-dialog';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth } from '@/lib/auth';
import config from '@/lib/config';
import { FootballerAPI } from '@/lib/footballer-api';

export default function FootballerCareerApp() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState('');
  const [searchMode, setSearchMode] = useState<'name' | 'wikipedia_url'>('name');
  const [playerData, setPlayerData] = useState<n8nWikiPlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection settings from ConnectionSettings component
  const [connectionSettings, setConnectionSettings] = useState({
    webhookUrl: config.N8N_WEBHOOK_URL,
  });

  // State for managing data source choice from validation
  const [chosenDataSource, setChosenDataSource] = useState<'wikipedia' | 'database' | null>(null);

  // State for database player info (fetched via API when playerDBId is available)
  const [dbPlayerInfo, setDbPlayerInfo] = useState<Footballer | null>(null);
  const [loadingDbPlayer, setLoadingDbPlayer] = useState(false);

  // Initialize with URL parameters
  useEffect(() => {
    const name = searchParams.get('name');
    const url = searchParams.get('url');
    const useWikiUrl = searchParams.get('useWikiUrl');
    if (useWikiUrl === 'true' && url) {
      setSearchMode('wikipedia_url');
      setSearchValue(url);
      setTimeout(() => {
        handleSearch('wikipedia_url', url);
      }, 100);
    } else if (name) {
      setSearchMode('name');
      setSearchValue(name);
      setTimeout(() => {
        handleSearch('name', name);
      }, 100);
    }
  }, [searchParams]);

  // Fetch database player info using the playerDBId
  const fetchDbPlayerInfo = async (playerDBId: number) => {
    try {
      setLoadingDbPlayer(true);
      const footballer = await FootballerAPI.getFootballer(playerDBId);
      setDbPlayerInfo(footballer);
      return footballer;
    } catch (error) {
      setDbPlayerInfo(null);
      return null;
    } finally {
      setLoadingDbPlayer(false);
    }
  };

  // Handle reload player - triggers a fresh search with current player name
  const handleReloadPlayer = () => {
    if (searchValue.trim()) {
      setChosenDataSource(null);
      setDbPlayerInfo(null);
      setError(null);
      handleSearch(searchMode, searchValue);
    }
  };

  const handleSearch = async (mode = searchMode, value = searchValue) => {
    if (!value.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setPlayerData(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const body = mode === 'wikipedia_url' ? { wikipedia_url: value } : { name: value };
        const response = await fetch(connectionSettings.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          mode: 'cors',
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Read as text first to handle empty/truncated responses
        const responseText = await response.text();

        if (!responseText || responseText.trim().length === 0) {
          throw new Error(`Empty response received from webhook (status ${response.status})`);
        }

        try {
          const data = JSON.parse(responseText);
          setPlayerData(data);
        } catch (parseError) {
          throw new Error(`Invalid JSON in webhook response (${responseText.length} chars): ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceChosen = (dataSource: 'wikipedia' | 'database') => {
    setChosenDataSource(dataSource);
    console.log(`Data source chosen: ${dataSource}`);
  };

  useEffect(() => {
    if (playerData) {
      // Check if player exists in DB and fetch player info via API
      if (playerData.playerFoundInDB && playerData.playerDBId) {
        fetchDbPlayerInfo(playerData.playerDBId);
      } else {
        // Reset state for new players
        setChosenDataSource(null);
        setDbPlayerInfo(null); // Clear previous DB player info
      }
    }
  }, [playerData]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation */}
        <Navigation />

        {/* Header with utility buttons */}
        <div className="relative space-y-2 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Footballer Career Lookup</h1>
          <p className="text-gray-600 dark:text-gray-300">Search for detailed career information of football players</p>

          {/* Desktop layout - settings button positioned absolutely */}
          <div className="absolute right-0 top-0 hidden items-center gap-2 md:flex">
            {/* Connection Settings Dialog */}
            <ConnectionSettings
              onSettingsChange={setConnectionSettings}
            />

            {/* Help/Info Dialog */}
            <HelpDialog />
          </div>
        </div>

        {/* Search Form */}
        <CareerLookupSearch
          searchValue={searchValue}
          searchMode={searchMode}
          loading={loading}
          onSearchValueChange={setSearchValue}
          onSearchModeChange={setSearchMode}
          onSearch={() => handleSearch(searchMode, searchValue)}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              <strong>Error:</strong>
              {' '}
              {error}
              <br />
              <br />
              <strong>Quick fixes:</strong>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>Click the settings button (⚙️) above to test your connection</li>
                <li>Make sure your n8n workflow is running on the specified port</li>
                <li>Try the API testing button (💻) above for direct webhook testing</li>
                <li>Check the help button (❓) for more guidance</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Validation Dialog */}
        <CareerLookupDataValidation
          playerData={playerData}
          dbPlayerInfo={dbPlayerInfo}
          onDataSourceChosen={handleDataSourceChosen}
        />

        {/* Player Data Display - Two Column Layout */}
        {playerData && (
          <>
            <CareerLookupInfo
              playerData={playerData}
              dbPlayerInfo={dbPlayerInfo}
              chosenDataSource={chosenDataSource}
              onDataSourceChange={setChosenDataSource}
            />

            {/* Player Configuration Section - Full Width */}
            <CareerLookupPlayerConfiguration
              playerData={playerData}
              dbPlayerInfo={dbPlayerInfo}
              chosenDataSource={chosenDataSource}
              onErrorChange={setError}
              onReloadPlayer={handleReloadPlayer}
            />
          </>
        )}
      </div>
    </div>
  );
}
