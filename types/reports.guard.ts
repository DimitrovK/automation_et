import type { ReportsAPI } from '@/lib/reports-api';
/**
 * Compile-time guard: every range-filtered reporting response must carry the
 * full filter echo the backend sends.
 *
 * This exists because the same bug happened three times: a response type
 * hand-declares `start`/`end`/`window`/... instead of composing `ResolvedRange`,
 * the backend adds a field to `as_payload()`, and the copy quietly rots. It
 * fails open — the UI reads a field that is typed as absent, so nothing errors,
 * it just silently can't be used.
 *
 * The list is DERIVED from `ReportsAPI` rather than written out, because a
 * hand-maintained list of "types to check" is the same debt in a new place.
 * Any method taking `ReportParams` is range-filtered by definition, so a new
 * endpoint is covered the moment it is added — nobody has to remember this file.
 *
 * There is nothing to run: `npm run check-types` fails if it regresses.
 */
import type { ReportParams, ResolvedRange, WindowEcho } from '@/types/reports';

/** The response of `T`, but only if `T` accepts `ReportParams`. */
type RangeFilteredResponse<T>
  = T extends (...args: any[]) => Promise<infer Response>
    ? ReportParams extends Parameters<T>[number] ? Response : never
    : never;

/**
 * Endpoints that legitimately echo less than the full filter set, with the
 * reason. Typed as a record so adding one is a deliberate, reviewed act rather
 * than something that can drift in — and every entry still has to satisfy
 * `WindowEcho` below, so an exemption narrows the check without removing it.
 */
type DocumentedExemptions = {
  /**
   * Scoped to one user; `game_type`/`include_bots` don't apply and the BE
   *  deliberately doesn't echo them (they'd read as accepted-but-ignored).
   */
  getPlayerDetail: 'scoped to a single user, no game/bot filter to echo';
};

/**
 * The method names whose response is missing part of the range echo.
 *
 * Built as a key-remapped type rather than a union of responses so the compiler
 * error names the offenders ("getMultiplayer" | "getTopPlayers") instead of
 * saying a union isn't assignable and leaving you to find which member.
 */
type MethodsMissingRangeEcho = keyof {
  [K in keyof typeof ReportsAPI as
  K extends keyof DocumentedExemptions
    ? never
    : RangeFilteredResponse<(typeof ReportsAPI)[K]> extends ResolvedRange ? never : K
  ]: true;
};

/** No exemption may skip the window echo — that part applies to every endpoint. */
type MethodsMissingWindowEcho = keyof {
  [K in keyof typeof ReportsAPI as
  RangeFilteredResponse<(typeof ReportsAPI)[K]> extends WindowEcho ? never : K
  ]: true;
};

/** Applies to exempt endpoints too, so an exemption can't become a blank cheque. */
export const WINDOW_ECHO_IS_COMPLETE: never
  = undefined as unknown as MethodsMissingWindowEcho;

/**
 * The assertion: no method may be missing the echo. If one is, this fails to
 * compile with the method name in the error.
 */
export const RANGE_ECHO_IS_COMPLETE: never
  = undefined as unknown as MethodsMissingRangeEcho;
