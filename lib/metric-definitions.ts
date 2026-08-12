/**
 * What every reported number actually means.
 *
 * One registry, two surfaces: the info affordance next to a metric and the
 * glossary page both read from here, so a definition can't be right in one
 * place and stale in the other.
 *
 * `caveat` is the field that earns this file. Most of these numbers are easy to
 * read wrongly in a way that looks perfectly reasonable — a distinct-player
 * count that seems additive, a 0% completion that actually means "nobody
 * played", a retention cohort inflated by its own window. Every caveat here
 * corresponds to a mistake that was actually made while building these reports.
 */

export type MetricDefinition = {
  key: string;
  label: string;
  /** One line: what the number counts. */
  counts: string;
  /** What is deliberately left out. Empty string when nothing is. */
  excludes: string;
  /** How to misread it. Omitted only when there is genuinely no trap. */
  caveat?: string;
  /** Keys of metrics worth reading alongside this one. */
  related?: string[];
};

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: 'games_started',
    label: 'Games played',
    counts: 'Sessions started in the window, across every game mode.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'A started session is not a played one — someone who opens a game and leaves counts here. Read it next to Finished rather than alone.',
    related: ['games_finished', 'completion_pct'],
  },
  {
    key: 'games_finished',
    label: 'Games finished',
    counts: 'Sessions in the window that reached a finished state.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'Attributed to the day the session STARTED, so a game begun before midnight and finished after it counts on the earlier day. Totals stay consistent; a single day can look slightly off.',
    related: ['games_started', 'completion_pct'],
  },
  {
    key: 'distinct_players',
    label: 'Players',
    counts: 'Distinct accounts that started at least one session in the window.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'NOT additive. Someone who plays Grid and Quiz on three days is one player, not six — so per-game numbers do not sum to the platform figure, and per-day numbers do not sum to the window. Summing them inflated this figure 5.6× before it was caught.',
    related: ['sessions_per_player', 'new_players'],
  },
  {
    key: 'mp_player_sessions',
    label: 'Multiplayer participations',
    counts: 'One per player per multiplayer session — four players in a room is four.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'A different grain from every "rooms" figure on the Multiplayer page, which counts rooms. Four players in one room is 4 participations and 1 room; the two will never agree, and neither is wrong.',
    related: ['rooms_created'],
  },
  {
    key: 'completion_pct',
    label: 'Completion rate',
    counts: 'Finished divided by started, for sessions in the window.',
    excludes: 'Games nobody played — those report no rate at all.',
    caveat:
      'Null is not zero. A game nobody touched has no completion rate; showing 0% would read as "everyone abandoned it", which is the opposite of what happened. Unmeasured games sort last rather than bottom.',
    related: ['games_started', 'games_finished'],
  },
  {
    key: 'sessions_per_player',
    label: 'Sessions per player',
    counts: 'Sessions started divided by distinct players, in the window.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'Depth, not reach. It rises when a small group plays a lot AND when a large audience drifts away, so it only means something read beside player count.',
    related: ['distinct_players', 'repeat_rate_pct'],
  },
  {
    key: 'share_pct',
    label: 'Share of play',
    counts: 'This game\'s sessions as a percentage of all sessions in the window.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'Relative, so a game\'s share can rise while its own play falls — it only needs to fall more slowly than everything else. Check the trend before reading a rising share as growth.',
    related: ['games_started', 'trend_pct'],
  },
  {
    key: 'repeat_rate_pct',
    label: 'Came back',
    counts: 'Share of a game\'s players who played it on more than one distinct day.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'Counted over days, not sessions, so five games in one sitting is not "coming back". Short windows suppress it mechanically: nobody can return across two days in a one-day window.',
    related: ['retention_d1', 'sessions_per_player'],
  },
  {
    key: 'trend_pct',
    label: 'Trend',
    counts: 'Change against the immediately preceding window of equal length.',
    excludes: 'Windows where the previous period had no activity to compare against.',
    caveat:
      'Weekday-sensitive. A 7-day window compares like with like; a 3-day window can straddle a weekend and swing hard for reasons that have nothing to do with the game.',
    related: ['games_started'],
  },
  {
    key: 'rooms_created',
    label: 'Rooms created',
    counts: 'Multiplayer rooms opened in the window, regardless of whether they started.',
    excludes: 'Solo sessions entirely.',
    caveat:
      'Counts rooms, not people. Compare with multiplayer participations for the per-player view.',
    related: ['never_started_pct', 'mp_player_sessions'],
  },
  {
    key: 'never_started_pct',
    label: 'Never started',
    counts: 'Share of rooms opened in the window that never began play.',
    excludes: 'Rooms opened before the window.',
    caveat:
      'Usually a matchmaking signal rather than a game-quality one — it mostly means not enough players arrived, so it tracks concurrency more than the game itself.',
    related: ['rooms_created'],
  },
  {
    key: 'retention_d1',
    label: 'Retention (D1 / D7 / D30)',
    counts: 'Of players whose first session fell on a given day, the share who played again 1, 7 or 30 days later.',
    excludes: 'Cohorts too recent for the milestone to have happened yet.',
    caveat:
      'The earliest cohort in a window is inflated: some of its "new" players were not new, they were simply first seen inside the window. It is flagged and left out of the averages — treat it as unreliable, not as the best day you ever had.',
    related: ['new_players', 'repeat_rate_pct'],
  },
  {
    key: 'new_players',
    label: 'New vs returning',
    counts: 'New = the account was REGISTERED that day. Returning = registered earlier.',
    excludes: 'Bot and simulation accounts, unless "include bots" is on.',
    caveat:
      'This is registration, not first play. Someone who signed up months ago and plays for the first time today is "returning". A healthy day has both: all-returning means growth stalled, all-new means nobody stays.',
    related: ['distinct_players', 'retention_d1'],
  },
  {
    key: 'median_duration',
    label: 'Session length',
    counts: 'Median minutes between a session starting and finishing.',
    excludes: 'Unfinished sessions, which have no end to measure.',
    caveat:
      'Not comparable across games. Conquest is a campaign played over days — its real median is around 1,440 minutes — while Grid is one sitting. Capping the outliers deleted 72% of Conquest\'s data before that was understood; sessions are now flagged instead, and only single-sitting games are comparable with each other.',
    related: ['games_finished'],
  },
  {
    key: 'peak_cell',
    label: 'Busiest slot',
    counts: 'The single weekday-and-hour with the most sessions started, in Europe/Sofia.',
    excludes: 'Windows with no activity, which report no peak rather than defaulting to Monday 00:00.',
    caveat:
      'Not the peak day crossed with the peak hour. Those two need not intersect at a busy cell — on real data they point at Thursday 15:00 while the actual busiest slot is Tuesday 16:00.',
    related: ['peak_hour'],
  },
  {
    key: 'peak_hour',
    label: 'Peak hour / busiest day',
    counts: 'The hour, and the weekday, with the most sessions started — each totalled separately.',
    excludes: 'Windows with no activity.',
    caveat:
      'These are two independent totals. Multiplying them together to guess "when" is the mistake the heatmap exists to prevent.',
    related: ['peak_cell'],
  },
  {
    key: 'coverage',
    label: 'Coverage',
    counts: 'Which days in the window have actually been computed by the rollup.',
    excludes: 'Nothing — it describes the data rather than the play.',
    caveat:
      'An uncomputed day is not a quiet day. Without this, a missing rollup reads as genuine zero activity, which is why "typical Wednesday: 0" once appeared next to "+100% vs usual". Charts mark uncovered days rather than drawing them at zero.',
    related: ['anomaly_threshold'],
  },
  {
    key: 'anomaly_threshold',
    label: 'Needs attention',
    counts: 'Movements above 25% against the previous window, on at least 30 sessions.',
    excludes: 'Everything quieter — deliberately.',
    caveat:
      'The thresholds are the point. Without a volume floor a game going 2→5 shouts "+150%" over a real 20% drop on thousands of sessions; without a percentage floor, ordinary variation trains you to ignore the panel. An empty list means nothing moved, and says so differently from "we could not tell".',
    related: ['coverage', 'trend_pct'],
  },
  {
    key: 'bots',
    label: 'Bot accounts',
    counts: 'Nothing by itself — a filter applied to every metric on every page.',
    excludes: 'Accounts flagged as dummy/simulation in the backend.',
    caveat:
      'Off by default everywhere, because simulation runs would otherwise dominate quiet days. Anonymous players are real people and are always included — they are not bots.',
  },
];

export const METRICS_BY_KEY: Record<string, MetricDefinition> = Object.fromEntries(
  METRIC_DEFINITIONS.map(definition => [definition.key, definition]),
);
