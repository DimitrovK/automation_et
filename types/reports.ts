// Types for the staff-only Reports section.
// Field names mirror the Django BE payloads from `/core/reporting/*` — keep them
// in sync if `core/reporting_views.py` changes.

/** The four metrics every activity payload carries. */
export type ActivityMetrics = {
  games_started: number;
  games_finished: number;
  distinct_players: number;
  /** Multiplayer participations (per player). Solo = games_started - this. */
  mp_player_sessions: number;
};

export type ActivityDay = {
  date: string;
  /** False = never computed. NOT the same as zero activity. */
  covered: boolean;
} & ActivityMetrics;

export type Coverage = {
  complete: boolean;
  uncovered_days: string[];
  covered_days: number;
};

export type ActivityResponse = {
  /** Echoes the bucket size used, so a chart can label its axis correctly. */
  granularity: Granularity;
  coverage: Coverage;
  totals: ActivityMetrics;
  series: ActivityDay[];
} & ResolvedRange;

/** One headline metric: today, against the same-weekday baseline. */
export type PulseMetric = {
  /** The whole-day figure — "on track for X", as opposed to "normal so far". */
  baseline_full_day: number | null;
  today: number;
  yesterday: number;
  /** Mean of the previous N same weekdays. */
  /** Null when the baseline period has uncovered days. */
  baseline_same_weekday: number | null;
  /** Null when the baseline is 0 and today is 0 — i.e. no meaningful comparison. */
  delta_pct_vs_baseline: number | null;
};

export type Pulse = {
  date: string;
  weekday: string;
  baseline_weeks: number;
  /** False when a baseline day was never rolled up — show "no baseline", not 0. */
  baseline_covered: boolean;
  baseline_missing_days: string[];
  /**
   * How much of a typical day has happened, 0..1 — from the observed hour
   * distribution, not the clock. The baseline is scaled by it so today-so-far
   * is compared with the same share of a typical day rather than four whole ones.
   */
  elapsed_share: number;
  metrics: Record<keyof ActivityMetrics, PulseMetric>;
};

export type GameTotals = {
  game_type: string;
  /** finished / started. Null when nobody played — 0% would read as "everyone bailed". */
  completion_pct: number | null;
  sessions_per_player: number | null;
  /** Share of platform volume. Null when the platform had no activity at all. */
  share_pct: number | null;
  repeat_players: number;
  /** Share of this game's players who came back on ANOTHER day. */
  repeat_rate_pct: number | null;
  previous_games_started: number;
  /** vs the immediately preceding window. */
  trend_pct: number | null;
} & ActivityMetrics;

export type MetricComparison = {
  current: number;
  previous: number;
  change: number;
  /** Null when a period has gaps, or the previous period was zero. */
  change_pct: number | null;
};

export type PeriodComparison = {
  current: { start: string; end: string; days: number };
  previous: { start: string; end: string; days: number };
  /**
   * How many periods back the comparison reached: 1 is the one immediately
   * before. Null when a period was named outright, which no offset describes.
   * Optional so a backend predating it reads as the old always-1 behaviour.
   */
  compare_offset?: number | null;
  /**
   * False when the two periods differ in length. Their totals still compare;
   * their percentages don't — a rate across unequal spans describes the
   * calendar rather than the platform, so `change_pct` is withheld.
   */
  same_length?: boolean;
  coverage: {
    complete: boolean;
    missing_current_days: string[];
    missing_previous_days: string[];
  };
  metrics: Record<keyof ActivityMetrics, MetricComparison>;
};

export type SummaryResponse = {
  pulse: Pulse;
  /** False when the range doesn't end today — the pulse describes today only. */
  pulse_applies: boolean;
  /** The same question at the scale the platform supports. Leads over `pulse`. */
  weekly_pulse: WeeklyPulse;
  comparison: PeriodComparison;
  window_totals: ActivityMetrics;
  by_game: GameTotals[];
} & ResolvedRange;

export type MultiplayerGameRow = {
  game_type: string;
  rooms_created: number;
  rooms_started: number;
  rooms_finished: number;
  rooms_cancelled: number;
  never_started_pct: number;
};

/** One row of the multiplayer funnel split by mode. Quiz has no mode column. */
export type MultiplayerModeRow = {
  game_type: string;
  mode: string | null;
  rooms_created: number;
  rooms_started: number;
  rooms_finished: number;
};

export type MultiplayerResponse = {
  /** Always 'rooms' — a reminder this is a different grain from mp_player_sessions. */
  grain: string;
  totals: Omit<MultiplayerGameRow, 'game_type'>;
  by_game: MultiplayerGameRow[];
  by_mode: MultiplayerModeRow[];
} & ResolvedRange;

export type TopPlayer = {
  user_id: number;
  username: string;
  games_played: number;
  games_finished: number;
  /**
   * How many of those sessions were played against other people. Solo is the
   * difference — derived, never sent, so the two can't disagree with the total.
   * Optional so a backend predating it shows no split rather than claiming 0.
   */
  mp_sessions?: number;
  distinct_games: number;
  games: string[];
};

export type TopPlayersResponse = {
  limit: number;
  /** Echoed so an empty list reads as "no matches" rather than "no data". */
  search: string | null;
  players: TopPlayer[];
} & ResolvedRange;

/**
 * Windows the BE accepts (ALLOWED_WINDOWS in core/reporting_views.py).
 *
 * 1 is here so "today" is a preset rather than two identical dates picked by
 * hand. It is rendered as a named button, not as "1d" — see `RangePicker`.
 */
export const REPORT_WINDOWS = [1, 7, 10, 15, 30, 60, 90] as const;
export type ReportWindow = (typeof REPORT_WINDOWS)[number];

export type ReportParams = {
  window?: ReportWindow;
  /** YYYY-MM-DD. Takes precedence over `window` server-side. */
  start?: string;
  /** YYYY-MM-DD, inclusive. Defaults to today when `start` is given. */
  end?: string;
  game_type?: string;
  include_bots?: boolean;
  limit?: number;
  /** Anomaly knobs. Bounded server-side; out-of-range values are rejected. */
  min_volume?: number;
  min_change_pct?: number;
  /** Bucket size for the activity series. Rejected server-side if unknown. */
  granularity?: Granularity;
  /** Username fragment, case-insensitive. Narrows who is counted, not who survives. */
  search?: string;
};

/**
 * Buckets the activity series can be rolled up into.
 *
 * Server-side, because distinct players are not additive: a week's figure has
 * to be computed, not summed from its days.
 */
export type Granularity = 'day' | 'week' | 'month';

export const GRANULARITIES: Granularity[] = ['day', 'week', 'month'];

/**
 * The part of the echo every range-filtered response carries, including the
 * player drill-down (which has no game/bot filter to echo back).
 */
export type WindowEcho = {
  start: string;
  end: string;
  days: number;
  window: number;
};

/** Filter echo every game-filtered reporting response carries. */
export type ResolvedRange = {
  start: string;
  end: string;
  days: number;
  window: number;
  game_type: string | null;
  include_bots: boolean;
};

export type HourRow = { hour: number; games_started: number };
export type WeekdayRow = { weekday: number; name: string; games_started: number };
export type NewReturningRow = {
  date: string;
  new_players: number;
  returning_players: number;
  total_players: number;
};

/**
 * One weekday of the heatmap. `hours` is always 24 long — the BE sends it
 *  dense so a gap can never be misread as a quiet hour.
 */
export type HourWeekdayRow = {
  weekday: number;
  name: string;
  hours: number[];
};

export type PeakCell = {
  weekday: number;
  name: string;
  hour: number;
  games_started: number;
};

export type PatternsResponse = {
  timezone: string;
  by_hour: HourRow[];
  by_weekday: WeekdayRow[];
  by_hour_weekday: HourWeekdayRow[];
  /**
   * Busiest single slot. Null when the window has no activity at all — the
   *  argmax of an all-zero grid would otherwise render as a real finding.
   */
  peak_cell: PeakCell | null;
  busiest_cell_games: number;
  peak_hour: number | null;
  peak_weekday: string | null;
  new_vs_returning: NewReturningRow[];
} & ResolvedRange;

export type PlayerGameRow = {
  game_type: string;
  games_played: number;
  games_finished: number;
  completion_pct: number;
  /** Multiplayer sessions in this game. Solo is games_played minus this. */
  mp_sessions?: number;
};

export type PlayerDetailResponse = {
  user_id: number;
  username: string;
  is_bot: boolean;
  date_joined: string;
  totals: {
    games_played: number;
    games_finished: number;
    completion_pct: number | null;
    distinct_games: number;
    mp_sessions?: number;
    /**
     * Share of this player's sessions played against other people. Null when
     * they played nothing — 0% would claim they played solo.
     */
    mp_share_pct?: number | null;
    active_days: number;
    active_days_pct: number | null;
    games_per_active_day: number | null;
  };
  favourite_game: string | null;
  by_game: PlayerGameRow[];
  series: { date: string; games_started: number; games_finished: number }[];
} & WindowEcho;

/** Display metadata from the BE registry — the single source of truth for colours. */
export type GameMeta = {
  key: string;
  label: string;
  /**
   * The game's own name — "Grid", not "Grid Game Sessions". Use this wherever a
   * game is named; `label` is a dashboard card title that reads as a metric.
   * Optional so a backend predating it degrades to `label` rather than to a slug.
   */
  display_name?: string;
  /**
   * The same game's id in the FRONTEND's vocabulary — the kebab slug stored in
   * `User.favourite_games` ("line-up-game" for missing11, "tenagoal" for
   * tenable). A second naming system, not a formatting of `key`, so favourites
   * data can only be joined to this registry through it. Optional so a backend
   * predating it leaves favourites uncoloured rather than breaking the page.
   */
  favourite_slug?: string;
  /** Hex for a light surface. Same colour the Django admin dashboard draws the game with. */
  color: string;
  /**
   * Hex for a dark surface — the same hue re-stepped, not a computed flip.
   * Optional so the UI keeps working against a BE that predates it.
   */
  color_dark?: string;
};

export type GamesResponse = { games: GameMeta[] };

/** A metric explained, from the BE registry that sits beside the query. */
export type MetricDefinition = {
  key: string;
  label: string;
  counts: string;
  /** Empty string when nothing is excluded — that is a claim too, not a gap. */
  excludes: string;
  /** How the number can be misread. Empty when there is genuinely no trap. */
  caveat: string;
  related: string[];
};

export type GlossaryResponse = { metrics: MetricDefinition[] };

/** State of the rollup every report is built on. Not range-filtered. */
export type RollupHealth = {
  has_data: boolean;
  earliest: string | null;
  latest: string | null;
  days_covered: number;
  gap_count: number;
  /** Capped server-side; `gaps_truncated` says when there are more. */
  gaps: string[];
  gaps_truncated: boolean;
  /** Days behind yesterday. Null when nothing has ever been computed. */
  stale_days: number | null;
  /** The exact backfill command, or null when there is nothing to run. */
  suggested_command: string | null;
};

/** Which activity metric a chart or table is currently showing. */
export const METRIC_OPTIONS = [
  { key: 'games_started', label: 'Played' },
  { key: 'games_finished', label: 'Finished' },
  { key: 'distinct_players', label: 'Players' },
  { key: 'mp_player_sessions', label: 'Multiplayer' },
] as const;

export type MetricKey = (typeof METRIC_OPTIONS)[number]['key'];

export type RetentionCell = { returned: number; pct: number | null };

export type RetentionCohort = {
  date: string;
  cohort_size: number;
  /** True for the window's first day, whose "new" cohort is mostly veterans. */
  inflated: boolean;
  /** Null when the cohort hasn't reached that offset yet — NOT 0%. */
  retention: Record<string, RetentionCell | null>;
};

export type RetentionSummaryCell = {
  cohorts_measured: number;
  players: number;
  returned: number;
  pct: number | null;
  /**
   * True when the sample is too small to state a rate. The counts are still
   * reported — only the percentage is withheld, because "1 of 3 came back" is
   * 33% and reads as a finding beside a game with 400 players.
   */
  below_threshold?: boolean;
};

/**
 * One game's own retention: its cohorts, its returns.
 *
 * Keyed by offset (`d1`, `d7`, `d30`) and optional, because which offsets are
 * present follows `offsets` in the response. A plain `Record<string, …>` would
 * claim every string key exists and admit any field at all, so a typo'd offset
 * would type-check and read as missing data at runtime.
 */
export type RetentionGameRow = {
  game_type: string;
} & Partial<Record<`d${number}`, RetentionSummaryCell>>;

export type RetentionResponse = {
  /** States what "new" means here — a window return rate, not lifetime retention. */
  basis: string;
  first_cohort_inflated: boolean;
  offsets: number[];
  summary: Record<string, RetentionSummaryCell>;
  cohorts: RetentionCohort[];
  /**
   * Per-game retention, best keeper first. A game's cohort is players whose
   * first day in THAT game was X, returning to THAT game — a different question
   * from the platform summary, which counts a return to anything.
   * Optional so a backend predating it renders the platform view alone.
   */
  by_game?: RetentionGameRow[];
  /** Players a game needs before its rate is stated rather than withheld. */
  min_players?: number;
  /**
   * The median across games, per offset — the reference a game should be read
   * against. Not the platform figure: that counts different cohorts and
   * different returns, so a game can sit either side of it.
   */
  game_median?: Record<string, number | null>;
} & ResolvedRange;

export type DurationRow = {
  game_type: string;
  /** False when the game records no session end time at all. */
  supported: boolean;
  reason: string | null;
  sessions: number;
  measured: number;
  /** Share of finished sessions that could be measured — varies 69%-100%. */
  coverage_pct: number | null;
  median_seconds: number | null;
  p90_seconds: number | null;
  /**
   * The quartiles either side of the median. Half of all sessions fall between
   * them, so "5 minutes" reads very differently at 4–6 than at 1–40.
   * Optional so a backend predating them shows the median alone.
   */
  p25_seconds?: number | null;
  p75_seconds?: number | null;
  /**
   * Session lengths per band, over fixed boundaries. Per-band counts, not
   * cumulative — they sum to `measured`. The final band has `under_seconds:
   * null`: everything past the last boundary, which is where a 24-hour session
   * lands.
   */
  buckets?: { under_seconds: number | null; count: number }[];
  long_sessions: number;
  long_sessions_pct: number | null;
  /** False for campaign-shaped games whose "session" spans a day, not a sitting. */
  single_sitting: boolean | null;
  /**
   * Seconds of idleness after which a sweeper task closes an unfinished session,
   * or null for games with no such job. Optional because a backend predating
   * these fields sends none of them — such a row explains nothing rather than
   * guessing which of two opposite explanations applies.
   */
  idle_finish_seconds?: number | null;
  /** Measured sessions sitting at or past that ceiling — timed by the sweeper. */
  swept_sessions?: number;
  swept_pct?: number | null;
  /**
   * Median among sessions that ended by play rather than by the sweeper. For a
   * swept game this is the only comparable number it has.
   */
  median_excluding_swept_seconds?: number | null;
  /**
   * Why the sessions are long. 'idle_sweep' means the length is a housekeeping
   * job's clock; 'long_play' means the game really is played in long stretches.
   * A median cannot tell these apart, and they mean opposite things.
   */
  long_reason?: 'idle_sweep' | 'long_play' | null;
};

export type DurationResponse = {
  long_session_seconds: number;
  games_without_duration: string[];
  long_lived_session_games: string[];
  /** Longest among comparable games only — a campaign game would win by default. */
  longest_single_sitting_game: string | null;
  rows: DurationRow[];
} & ResolvedRange;

/**
 * One age band of a game's unfinished pool.
 *
 * Both bounds, not one. `to_hours` alone read as "under 24h" while meaning
 * "1-24h" — the youngest band is reported separately, so every edge above it is
 * a floor as well as a ceiling. A single bound produces overlapping bands that
 * each look correct alone, which is worse than an error.
 */
export type UnfinishedBucket = {
  from_hours: number;
  /** `null` on the open-ended top band. */
  to_hours: number | null;
  count: number;
};

export type UnfinishedRow = {
  game_type: string;
  unfinished: number;
  /**
   * Started within the last hour. Reported apart from the stale pool, never
   * folded into it: nothing distinguishes a session opened five minutes ago and
   * still being played from one walked away from, so counting it as abandonment
   * would report every game as worst during its own peak.
   */
  recent_sessions: number;
  stale_sessions: number;
  buckets: UnfinishedBucket[];
  /**
   * Hours of idleness after which this game's sweeper closes a session, or
   * `null` where it has none. A swept game CANNOT accumulate an old pool, so its
   * total is not comparable with one that never sweeps — rank without this and
   * the swept game reads as the healthiest on the platform.
   */
  sweeper_hours: number | null;
};

/**
 * A snapshot of what is unfinished right now — deliberately NOT range filtered.
 *
 * The abandonment figure on the games report is arithmetic over a window
 * (`games_started - games_finished`), which answers a different question and
 * counts a session started minutes ago as abandoned. A window on this one would
 * not merely be unused, it would be meaningless, so there is no `ResolvedRange`.
 */
export type UnfinishedResponse = {
  as_of: string;
  include_bots: boolean;
  rows: UnfinishedRow[];
  total_unfinished: number;
  total_stale_sessions: number;
};

/**
 * One starting game's first-timers, and how quickly they came back.
 *
 * The `returned_*` counts are CUMULATIVE: everyone in 24h is also in 48h and
 * 7d. Reported as disjoint bands they would each look smaller than they are and
 * could not be read against one another.
 */
export type FirstSessionRow = {
  game_type: string;
  /** Players whose first-ever session was this game, in the window. */
  new_players: number;
  /** True when there are too few first-timers for a rate to mean anything. */
  below_threshold: boolean;
  returned_24h: number;
  returned_48h: number;
  returned_168h: number;
  /** Null below the threshold — the count is still given. */
  returned_24h_pct: number | null;
  returned_48h_pct: number | null;
  returned_168h_pct: number | null;
};

export type FirstSessionResponse = {
  /** First-timers needed before a rate is stated. */
  min_players: number;
  total_new_players: number;
  rows: FirstSessionRow[];
} & ResolvedRange;

export type AnomalyFinding = {
  scope: 'platform' | 'game';
  game_type: string | null;
  metric: string;
  /** Null for findings that aren't a change (e.g. a low completion rate). */
  change_pct: number | null;
  current: number;
  previous: number | null;
  severity: 'high' | 'medium';
  headline: string;
  detail: string;
  /**
   * How many standard deviations the move sits outside ordinary noise at this
   * volume. `null` on rate findings, which have no Poisson difference to take.
   */
  z_score: number | null;
  /**
   * The smallest percentage move that would have been notable AT THIS VOLUME —
   * 71% at 36 sessions, 9.5% at 2,000. Carried for the non-findings as much as
   * the findings: without it, a reader seeing +28% missing from the panel
   * concludes the panel is broken.
   */
  required_pct: number | null;
};

export type AnomaliesResponse = {
  window_days: number;
  compared_with: { start: string; end: string };
  /** Returned so a reader can see what was filtered out, not just what survived. */
  thresholds: {
    min_volume: number;
    min_change_pct: number;
    severe_change_pct: number;
    /** The test that actually decides. `min_change_pct` is only a floor. */
    sigma: number;
  };
  /** Lets an empty list mean "nothing moved" rather than "we couldn't tell". */
  coverage: { complete: boolean; missing_days: string[] };
  findings: AnomalyFinding[];
} & ResolvedRange;

/** One band of "how far did they get", as a share of the session's own length. */
export type ProgressBand = {
  /** `none`, `under_25` … `under_100`, `complete`. */
  key: string;
  from_pct: number;
  /** `null` on `complete`, which has no ceiling above it. */
  to_pct: number | null;
  count: number;
  pct: number;
};

/**
 * How far into a session players got, for one game.
 *
 * Both shapes are present because either alone reads wrong: 44% of abandoned
 * Missing11 sessions made zero progress, which is an indictment of the game
 * until `finished_no_progress_pct` shows 3.6% of finished ones did the same.
 *
 * `supported: false` carries a `reason` and empty bands. Eight of the eleven
 * games are in that state, each for a different cause — a length that changes
 * with the mode, a length the map decides, or a game where guesses count
 * against the player — so the reason is printed rather than summarised.
 */
export type ProgressRow = {
  game_type: string;
  supported: boolean;
  reason: string | null;
  /** What is counted, plural and qualified: 'lineup slots filled'. Printed verbatim. */
  unit: string | null;
  /**
   * Opened and never started. Counted rather than filtered out: the games
   * disagree on when the flag is set, and excluding these would report Grid's
   * drop-off at a seventh of its real size.
   */
  never_started: number;
  sessions: number;
  abandoned: number;
  finished: number;
  abandoned_bands: ProgressBand[];
  finished_bands: ProgressBand[];
  abandoned_no_progress_pct: number | null;
  finished_no_progress_pct: number | null;
};

export type ProgressResponse = {
  rows: ProgressRow[];
  games_without_progress: string[];
  total_abandoned: number;
} & ResolvedRange;

/** One value of a game's difficulty axis, with its outcomes. */
export type DifficultyBucket = {
  value: string | null;
  /**
   * The value is not in the scale this game declared — a new difficulty nobody
   * wired up, or a typo. Flagged rather than dropped, since both are worth seeing.
   */
  off_scale: boolean;
  /** Too few sessions to state a rate. The count is still shown. */
  below_threshold: boolean;
  sessions: number;
  finished: number;
  swept: number;
  completion_pct: number | null;
  wins: number | null;
  decided: number | null;
  win_rate_pct: number | null;
};

/**
 * How hard one game is, on the axis it actually records.
 *
 * `swept` is the correction that makes the rest readable: Conquest writes LOSS
 * on anything idle for 24 hours, and 1,283 of its 2,122 losses still had lives
 * in hand. Both rates here exclude them, and the count is present so the
 * correction can be seen rather than taken on trust.
 */
export type DifficultyRow = {
  game_type: string;
  sessions: number;
  finished: number;
  swept: number;
  /** Hours of idleness after which this game's sweeper closes a session. */
  sweeper_hours: number | null;
  completion_pct: number | null;
  /** Whether this game records WIN/LOSS at all. Without it there is no win rate. */
  has_verdict: boolean;
  decided: number | null;
  /**
   * The share of sessions the win rate is computed from. Under 12% on four
   * games, where `result` is written for multiplayer rounds only.
   */
  verdict_coverage_pct: number | null;
  win_rate_pct: number | null;
  /** What the axis IS — 'Grid size' where that differs from 'Difficulty'. */
  difficulty_label: string | null;
  difficulty: DifficultyBucket[];
};

export type DifficultyResponse = {
  rows: DifficultyRow[];
  games_with_difficulty: string[];
  min_sessions: number;
} & ResolvedRange;

/** One band of wrong attempts per session. `to_attempts` is null on the last. */
export type AttemptBand = {
  from_attempts: number;
  to_attempts: number | null;
  count: number;
  pct: number;
};

export type AttemptRow = {
  game_type: string;
  sessions: number;
  /** 'session' or 'step' — what the allowance is per. */
  allowance_scope: string;
  /** Every distinct declared allowance seen in the window. */
  allowances: number[];
  /**
   * Sessions recording more wrong attempts than declared — only meaningful
   * where the allowance is per session. `null` on a per-step allowance, which
   * a session total cannot be compared with.
   */
  over_allowance: number | null;
  over_allowance_pct: number | null;
  bands: AttemptBand[];
};

export type AttemptsResponse = {
  rows: AttemptRow[];
} & ResolvedRange;

/**
 * One week of growth accounting.
 *
 * The four bands are exhaustive and do not overlap, which is what makes the flow
 * add up: `active - previous_active === new + resurrected - churned` on every
 * row. `churned` is POSITIVE — stacking it downward is the client's decision, so
 * a chart that does not expect a negative never finds one.
 */
export type GrowthRow = {
  /** Monday of the week, YYYY-MM-DD. */
  week: string;
  /** First session ever, not first in the window. */
  new: number;
  /** Active this week, not last week, but has played before. */
  resurrected: number;
  retained: number;
  churned: number;
  active: number;
  previous_active: number;
  net: number;
  /** Gained over lost. `null` where nothing churned — not infinity. */
  quick_ratio: number | null;
  /** The week is still running, so its churn cannot be known yet. */
  provisional: boolean;
  week_covered: boolean;
};

export type GrowthResponse = {
  rows: GrowthRow[];
  bands: string[];
  weeks_covered: number;
  summary: {
    new: number;
    resurrected: number;
    churned: number;
    quick_ratio: number | null;
  };
} & ResolvedRange;

/**
 * One game's content supply.
 *
 * Two shapes in one row, distinguished by `scheduled`. Scheduled games stage
 * material against a calendar and report `runway_days`; pooled games have no
 * calendar and report depth. Reading a pooled game's blank runway as "no runway"
 * would be wrong — it has no calendar to have one against.
 */
export type ContentRow = {
  game_type: string;
  /** One item, singular: 'lineup', 'quiz', 'grid'. */
  item: string;
  scheduled: boolean;
  total: number;
  unused: number;
  /** At their run cap and unusable. A cap of 0 means unlimited, not exhausted. */
  exhausted: number;
  usable: number;
  /**
   * Days until the last staged item goes live. NEGATIVE means the well ran dry
   * that many days ago — not clamped, because "ran out today" and "ran out three
   * weeks ago" decide different urgencies. `null` on pooled games.
   */
  runway_days: number | null;
  staged_ahead: number | null;
  last_staged: string | null;
  /** Below the warning threshold, or dry. */
  low: boolean;
  /** Already out of staged content. Branch on this, not on the sign. */
  dry: boolean;
  /** A shrinking pool here is a broken job, not a content shortage. */
  topped_up_by_a_job: boolean;
};

export type ContentResponse = {
  as_of: string;
  rows: ContentRow[];
  warning_days: number;
  games_running_low: string[];
};

/** One Conquest challenge type's answer-format fallbacks. */
export type FallbackRow = {
  challenge_type: string;
  challenges: number;
  multiple_choice: number;
  fallbacks: number;
  /** The denominator: succeeded plus fell back. Never all challenges. */
  wanted_multiple_choice: number;
  fallback_pct: number | null;
  /** Written before the flag existed. Counted, never assumed non-fallback. */
  unstamped: number;
};

export type FallbacksResponse = {
  rows: FallbackRow[];
  total_wanted_multiple_choice: number;
  total_fallbacks: number;
  total_unstamped: number;
} & ResolvedRange;

/**
 * The last seven complete days against the four weeks before them.
 *
 * Leads over the daily pulse because a day is not a meaningful sample at this
 * volume. `baseline` is null when any day in the comparison was never computed —
 * averaging over gaps divides real activity by four and calls it typical.
 */
export type WeeklyPulse = {
  start: string;
  end: string;
  baseline_weeks: number;
  baseline_covered: boolean;
  baseline_missing_days: string[];
  metrics: Record<string, {
    current: number;
    baseline: number | null;
    delta_pct: number | null;
  }>;
};
