import { permanentRedirect } from 'next/navigation';

/**
 * Quiz content moved under Football Data.
 *
 * The redirect stays because this URL is bookmarked and linked from outside the
 * app; a moved page that 404s teaches people the report is gone rather than
 * that it is somewhere better. Permanent, so it is cached and the old address
 * quietly stops being used.
 */
export default function QuestionsAnalyticsRedirect() {
  permanentRedirect('/analytics/football-data/questions');
}
