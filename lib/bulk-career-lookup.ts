/**
 * Pure business logic for bulk career lookup operations.
 * These functions have no React dependencies — they accept parameters and return values.
 */

import type { BulkLookupResult, CheckMode, NationComparison } from '@/components/bulk-career-lookup/types';
import type { DeploymentLogEntry } from '@/types/deployment';
import type { Footballer, FootballerNationStat, n8nWikiPlayerData, NationalTeam } from '@/types/player';
import { isNoInternationalCareer } from '@/components/career-lookup/international-career-card';
import config from '@/lib/config';
import { FootballerAPI } from '@/lib/footballer-api';
import { createLogEntry } from '@/types/deployment';

// ─── Wikipedia Data Fetching ────────────────────────────────────────────────

/**
 * Fetch Wikipedia data for a footballer via the n8n webhook.
 * Retries up to `retries` times with exponential backoff.
 */
export async function fetchWikipediaData(
  footballer: Footballer,
  useWikipediaUrl: boolean,
  retries = 2,
): Promise<n8nWikiPlayerData> {
  const webhookUrl = config.N8N_WEBHOOK_URL;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let payload: Record<string, string>;
      if (useWikipediaUrl && footballer.wikipedia_url) {
        payload = {
          wikipedia_url: footballer.wikipedia_url,
          name: `${footballer.first_name} ${footballer.last_name}`,
          dateOfBirth: footballer.date_of_birth,
        };
      } else {
        payload = {
          name: `${footballer.first_name} ${footballer.last_name}`,
          dateOfBirth: footballer.date_of_birth,
        };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Wikipedia API request failed: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error(`Empty response body received from webhook (status ${response.status})`);
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON in webhook response (${responseText.length} chars): ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
      }
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to fetch Wikipedia data after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  // TypeScript requires a return — unreachable due to the throw above
  throw new Error('Unexpected: all retry attempts exhausted');
}

// ─── Discrepancy Analysis ───────────────────────────────────────────────────

/**
 * Helper: ordinal suffix for team position display (1st, 2nd, 3rd, …)
 */
function getPositionSuffix(position: number): string {
  if (position >= 11 && position <= 13) {
    return 'th';
  }
  switch (position % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Compare database data against Wikipedia data and return a list of discrepancy descriptions.
 * This is a pure function — all dependencies are passed as parameters.
 */
export function analyzeDiscrepancies(
  databaseData: Footballer,
  wikipediaData: n8nWikiPlayerData,
  dbNationStats: FootballerNationStat[],
  checkMode: CheckMode,
): string[] {
  const discrepancies: string[] = [];

  if (!wikipediaData || !wikipediaData.playerFoundInDB) {
    discrepancies.push(`Player not found in Wikipedia or no data returned`);
    return discrepancies;
  }

  // ── Club career analysis ──
  if (checkMode !== 'nations') {
    if (wikipediaData.dateOfBirth && wikipediaData.dateOfBirth !== databaseData.date_of_birth) {
      discrepancies.push(`Date of birth mismatch: DB has ${databaseData.date_of_birth}, Wikipedia has ${wikipediaData.dateOfBirth}`);
    }

    if (wikipediaData.birthCountry && wikipediaData.countryFoundInDB === false) {
      discrepancies.push(`Country not found in database: Wikipedia shows ${wikipediaData.birthCountry}`);
    }

    const dbTeamCount = databaseData.teams_played_for?.length || 0;
    const wikiTeamCount = wikipediaData.teams?.length || 0;
    const dbUniqueTeams = new Set(databaseData.teams_played_for?.map(t => t.team_name.toLowerCase()) || []).size;
    const wikiUniqueTeams = new Set(wikipediaData.teams?.map(t => t.teamName.toLowerCase()) || []).size;

    if (Math.abs(dbUniqueTeams - wikiUniqueTeams) > 1) {
      discrepancies.push(`Unique team count difference: DB has ${dbUniqueTeams} unique teams (${dbTeamCount} total spells), Wikipedia has ${wikiUniqueTeams} unique teams (${wikiTeamCount} total spells)`);
    } else if (Math.abs(dbTeamCount - wikiTeamCount) > 2) {
      discrepancies.push(`Total career spells difference: DB has ${dbTeamCount} spells, Wikipedia has ${wikiTeamCount} spells`);
    }

    if (wikipediaData.totalAppearances) {
      const dbApps = databaseData.teams_played_for?.reduce((sum, team) => sum + (team.apps ?? 0), 0) || 0;
      const wikiApps = wikipediaData.totalAppearances;
      if (Math.abs(dbApps - wikiApps) > 10) {
        discrepancies.push(`Total career appearances mismatch: DB has ${dbApps}, Wikipedia has ${wikiApps} (across all teams)`);
      }
    }

    if (wikipediaData.totalGoals) {
      const dbGoals = databaseData.teams_played_for?.reduce((sum, team) => sum + (team.goals ?? 0), 0) || 0;
      const wikiGoals = wikipediaData.totalGoals;
      if (Math.abs(dbGoals - wikiGoals) > 5) {
        discrepancies.push(`Total career goals mismatch: DB has ${dbGoals}, Wikipedia has ${wikiGoals} (across all teams)`);
      }
    }

    if (wikipediaData.teams && Array.isArray(wikipediaData.teams)) {
      const notFoundTeams = wikipediaData.teams.filter(team => !team.teamFound);
      if (notFoundTeams.length > 0) {
        discrepancies.push(`Teams not found in database: ${notFoundTeams.map(team => team.teamName).join(', ')}`);
      }

      const wikiTeams = wikipediaData.teams;
      const dbTeams = databaseData.teams_played_for || [];
      const minLength = Math.min(wikiTeams.length, dbTeams.length);

      for (let i = 0; i < minLength; i++) {
        const wikiTeam = wikiTeams[i];
        const dbTeam = dbTeams[i];

        if (!wikiTeam.teamFound) {
          continue;
        }

        const positionSuffix = getPositionSuffix(i + 1);
        const teamPositionName = `${wikiTeam.teamName} (${i + 1}${positionSuffix} team)`;

        if (wikiTeam.teamID !== dbTeam.team_id) {
          discrepancies.push(`${teamPositionName} - Team ID mismatch: Wikipedia=${wikiTeam.teamID || 'Not Found'}, DB=${dbTeam.team_id}`);
        }

        if (Math.abs((wikiTeam.appearances || 0) - (dbTeam.apps || 0)) > 2) {
          discrepancies.push(`${teamPositionName} - Appearances mismatch: Wikipedia=${wikiTeam.appearances}, DB=${dbTeam.apps}`);
        }

        if (Math.abs((wikiTeam.goals || 0) - (dbTeam.goals || 0)) > 1) {
          discrepancies.push(`${teamPositionName} - Goals mismatch: Wikipedia=${wikiTeam.goals}, DB=${dbTeam.goals}`);
        }

        if (wikiTeam.joinYear !== dbTeam.start_year) {
          discrepancies.push(`${teamPositionName} - Join year mismatch: Wikipedia=${wikiTeam.joinYear}, DB=${dbTeam.start_year}`);
        }

        if (wikiTeam.departYear !== dbTeam.end_year) {
          discrepancies.push(`${teamPositionName} - Depart year mismatch: Wikipedia=${wikiTeam.departYear || 'Current'}, DB=${dbTeam.end_year || 'Current'}`);
        }

        const wikiTransferType = (wikiTeam.typeOfTransfer || '').toLowerCase().trim();
        const wikiType = wikiTransferType.includes('loan') ? 'loan' : 'permanent';
        if (wikiType !== dbTeam.transfer_type) {
          discrepancies.push(`${teamPositionName} - Transfer type mismatch: Wikipedia=${wikiType}, DB=${dbTeam.transfer_type}`);
        }
      }

      if (wikiTeams.length !== dbTeams.length) {
        if (wikiTeams.length > dbTeams.length) {
          const extraTeams = wikiTeams.length - dbTeams.length;
          const extraTeamNames = wikiTeams
            .slice(dbTeams.length)
            .map(team => team.teamName)
            .join(', ');
          discrepancies.push(`Wikipedia has ${extraTeams} additional team${extraTeams > 1 ? 's' : ''}: ${extraTeamNames}`);
        } else {
          const extraTeams = dbTeams.length - wikiTeams.length;
          const extraTeamNames = dbTeams
            .slice(wikiTeams.length)
            .map(team => team.team_name)
            .join(', ');
          discrepancies.push(`Database has ${extraTeams} additional team${extraTeams > 1 ? 's' : ''}: ${extraTeamNames}`);
        }
      }
    }
  }

  // ── National team analysis ──
  if (checkMode !== 'career') {
    const rawWikiNations = wikipediaData.nationalTeams || [];
    const wikiNations = isNoInternationalCareer(rawWikiNations) ? [] : rawWikiNations;

    if (wikiNations.length === 0 && dbNationStats.length > 0) {
      discrepancies.push(`Player has no international career on Wikipedia but has ${dbNationStats.length} national team record(s) in database`);
    } else if (wikiNations.length > 0 || dbNationStats.length > 0) {
      for (const wikiNation of wikiNations) {
        if (!wikiNation.nationFound) {
          discrepancies.push(`National team not in database: ${wikiNation.teamName}`);
          continue;
        }

        const dbMatch = dbNationStats.find(db => db.nation_id === wikiNation.nationID);
        if (!dbMatch) {
          discrepancies.push(`National team not synced: ${wikiNation.teamName} (${wikiNation.apps || 0} apps, ${wikiNation.goals || 0} goals)`);
        } else {
          const wikiApps = wikiNation.apps || 0;
          const wikiGoals = wikiNation.goals || 0;
          if (dbMatch.apps !== wikiApps || dbMatch.goals !== wikiGoals) {
            discrepancies.push(`National team stats mismatch for ${wikiNation.teamName}: DB=${dbMatch.apps}/${dbMatch.goals}, Wiki=${wikiApps}/${wikiGoals}`);
          }
        }
      }

      for (const dbNation of dbNationStats) {
        const wikiMatch = wikiNations.find((w: NationalTeam) => w.nationID === dbNation.nation_id);
        if (!wikiMatch) {
          discrepancies.push(`National team in DB but not in Wikipedia: ${dbNation.nation_name} (${dbNation.apps} apps, ${dbNation.goals} goals)`);
        }
      }
    }
  }

  return discrepancies;
}

// ─── Single Player Processing Pipeline ──────────────────────────────────────

type ProcessConfig = {
  useWikipediaUrl: boolean;
  checkMode: CheckMode;
  autoSyncNations: boolean;
};

/**
 * Full processing pipeline for one footballer: fetch wiki data, fetch DB data,
 * analyze discrepancies, and optionally auto-sync national teams.
 */
export async function processFootballerCareer(
  footballer: Footballer,
  processConfig: ProcessConfig,
): Promise<BulkLookupResult> {
  const { useWikipediaUrl, checkMode, autoSyncNations } = processConfig;
  const logs: DeploymentLogEntry[] = [];

  try {
    // Log which lookup method is being used
    if (useWikipediaUrl && footballer.wikipedia_url) {
      logs.push(
        createLogEntry(
          'info',
          `Player's ${footballer.first_name} ${footballer.last_name} Wikipedia URL found: ${footballer.wikipedia_url}.`,
          {
            wikipedia_url: footballer.wikipedia_url,
            lookup_url: `/career-lookup?url=${encodeURIComponent(footballer.wikipedia_url)}&useWikiUrl=true`,
          },
        ),
      );
    } else {
      const fullName = `${footballer.first_name} ${footballer.last_name}`;
      const wikiSearchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(fullName)}`;
      logs.push(
        createLogEntry(
          'info',
          `No Wikipedia URL found for ${fullName}. Using player full name for lookup. Wikipedia search: ${wikiSearchUrl}.`,
          {
            wikipedia_search_url: wikiSearchUrl,
            lookup_url: `/career-lookup?name=${encodeURIComponent(fullName)}&useWikiUrl=false`,
          },
        ),
      );
    }

    logs.push(createLogEntry('request', `Calling n8n webhook for Wikipedia data...`));
    const wikipediaData = await fetchWikipediaData(footballer, useWikipediaUrl);

    logs.push(createLogEntry('response', `Wikipedia data received successfully`, {
      playerFoundInDB: wikipediaData?.playerFoundInDB,
      teamsFound: wikipediaData?.teams?.length || 0,
    }));

    logs.push(createLogEntry('request', `Fetching fresh database data...`));
    const databaseData = await FootballerAPI.getFootballer(footballer.id);

    logs.push(createLogEntry('response', `Database data retrieved`, {
      teams_count: databaseData.teams_played_for?.length || 0,
    }));

    // Fetch DB national team stats if mode includes nations
    let dbNationStats: FootballerNationStat[] = [];
    if (checkMode !== 'career') {
      try {
        logs.push(createLogEntry('request', `Fetching database national team stats...`));
        dbNationStats = await FootballerAPI.getFootballerNations(footballer.id);
        logs.push(createLogEntry('response', `Found ${dbNationStats.length} national team record(s) in database`, {
          nations: dbNationStats.map(n => n.nation_name),
        }));
      } catch (error) {
        logs.push(createLogEntry('error', `Failed to fetch national team stats: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }

    logs.push(createLogEntry('loading', `Analyzing data for discrepancies...`));
    const discrepancies = analyzeDiscrepancies(databaseData, wikipediaData, dbNationStats, checkMode);

    if (discrepancies.length > 0) {
      logs.push(createLogEntry('error', `${discrepancies.length} discrepancy(ies) found`, {
        discrepancies: discrepancies.slice(0, 3),
      }));
    } else {
      logs.push(createLogEntry('success', `No discrepancies found - data matches!`));
    }

    // Determine national team data for inline sync
    const wikiNations: NationalTeam[] = wikipediaData?.nationalTeams || [];
    const noIntlCareer = isNoInternationalCareer(wikiNations);
    const cleanWikiNations = noIntlCareer ? [] : wikiNations;

    const result: BulkLookupResult = {
      footballer,
      status: discrepancies.length > 0 ? 'discrepancy' : 'completed',
      wikipediaData,
      databaseData,
      discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
      wikiNationalTeams: cleanWikiNations,
      dbNationalTeams: dbNationStats,
      hasNoInternationalCareer: noIntlCareer,
      logs,
    };

    // Auto-sync national team stats if enabled
    if (autoSyncNations && !noIntlCareer && checkMode !== 'career') {
      const nationDiscrepancies = discrepancies.filter(d => d.startsWith('National team') || d.startsWith('Player has no international'));
      if (nationDiscrepancies.length > 0) {
        logs.push(createLogEntry('info', `Auto-syncing ${nationDiscrepancies.length} national team discrepanc${nationDiscrepancies.length > 1 ? 'ies' : 'y'}...`));
        let syncedCount = 0;
        let failedCount = 0;

        for (const wikiNation of cleanWikiNations) {
          if (!wikiNation.nationFound || !wikiNation.nationID) {
            continue;
          }

          const dbMatch = dbNationStats.find(db => db.nation_id === wikiNation.nationID);

          if (!dbMatch) {
            try {
              await FootballerAPI.createFootballerNation({
                footballer_id: footballer.id,
                nation_id: wikiNation.nationID,
                apps: wikiNation.apps,
                goals: wikiNation.goals,
              });
              logs.push(createLogEntry('success', `Auto-synced: Added ${wikiNation.teamName} (${wikiNation.apps} apps, ${wikiNation.goals} goals)`));
              syncedCount++;
            } catch (err) {
              logs.push(createLogEntry('error', `Auto-sync failed for ${wikiNation.teamName}: ${err instanceof Error ? err.message : 'Unknown error'}`));
              failedCount++;
            }
          } else if (dbMatch.apps !== wikiNation.apps || dbMatch.goals !== wikiNation.goals) {
            try {
              await FootballerAPI.updateFootballerNation(dbMatch.id, {
                footballer_id: footballer.id,
                nation_id: dbMatch.nation_id,
                apps: wikiNation.apps,
                goals: wikiNation.goals,
              });
              logs.push(createLogEntry('success', `Auto-synced: Updated ${wikiNation.teamName} (${wikiNation.apps} apps, ${wikiNation.goals} goals)`));
              syncedCount++;
            } catch (err) {
              logs.push(createLogEntry('error', `Auto-sync failed for ${wikiNation.teamName}: ${err instanceof Error ? err.message : 'Unknown error'}`));
              failedCount++;
            }
          }
        }

        if (syncedCount > 0) {
          logs.push(createLogEntry('success', `Auto-sync complete: ${syncedCount} synced${failedCount > 0 ? `, ${failedCount} failed` : ''}`));
        }

        // Remove resolved national team discrepancies
        if (failedCount === 0) {
          const remainingDiscrepancies = discrepancies.filter(d => !d.startsWith('National team') && !d.startsWith('Player has no international'));
          result.discrepancies = remainingDiscrepancies.length > 0 ? remainingDiscrepancies : undefined;
          result.status = remainingDiscrepancies.length > 0 ? 'discrepancy' : 'completed';
          try {
            result.dbNationalTeams = await FootballerAPI.getFootballerNations(footballer.id);
          } catch { /* keep existing */ }
        }
      }
    }

    return result;
  } catch (error) {
    logs.push(createLogEntry('error', `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      error: error instanceof Error ? error.stack : error,
    }));

    return {
      footballer,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      logs,
    };
  }
}

// ─── Nation Comparison Helper ───────────────────────────────────────────────

/**
 * Compute nation comparisons for a single result (wiki vs DB stats).
 */
export function getNationComparisons(result: BulkLookupResult): NationComparison[] {
  const wikiNations = result.wikiNationalTeams || [];
  const dbNations = result.dbNationalTeams || [];

  return wikiNations.map((nt) => {
    if (!nt.nationFound || !nt.nationID) {
      return { wikiTeam: nt, dbStat: null, status: 'not-found' as const };
    }
    const dbMatch = dbNations.find(db => db.nation_id === nt.nationID) ?? null;
    if (!dbMatch) {
      return { wikiTeam: nt, dbStat: null, status: 'not-in-db' as const };
    }
    const isSynced = dbMatch.apps === nt.apps && dbMatch.goals === nt.goals;
    return { wikiTeam: nt, dbStat: dbMatch, status: (isSynced ? 'synced' : 'mismatch') as 'synced' | 'mismatch' };
  });
}
