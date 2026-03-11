import type { DeploymentLogEntry } from '@/types/deployment';
import type { Footballer, FootballerNationStat, n8nWikiPlayerData, NationalTeam } from '@/types/player';

export type CheckMode = 'career' | 'nations' | 'career-and-nations';

export type PlayerFilter = 'all' | 'active' | 'retired';

export type BulkLookupResult = {
  footballer: Footballer;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'discrepancy';
  wikipediaData?: n8nWikiPlayerData;
  databaseData?: Footballer;
  discrepancies?: string[];
  wikiNationalTeams?: NationalTeam[];
  dbNationalTeams?: FootballerNationStat[];
  hasNoInternationalCareer?: boolean;
  error?: string;
  logs: DeploymentLogEntry[];
};

export type BulkStats = {
  total: number;
  processed: number;
  discrepancies: number;
  errors: number;
};

export type DisplayStats = {
  total: number;
  processed: number;
  withoutIssues: number;
  discrepancies: number;
  errors: number;
};

export type NationComparison = {
  wikiTeam: NationalTeam;
  dbStat: FootballerNationStat | null;
  status: 'synced' | 'mismatch' | 'not-in-db' | 'not-found';
};

export type NationSyncStatusMap = Record<string, 'loading' | 'success' | 'error'>;
