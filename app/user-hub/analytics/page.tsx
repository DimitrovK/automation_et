import { permanentRedirect } from 'next/navigation';

/**
 * Favourites analytics moved into the games report.
 *
 * The redirect stays because this URL is bookmarked and linked from outside the
 * app; a moved page that 404s teaches people the report is gone rather than
 * that it is somewhere better. Permanent, so it is cached and the old address
 * quietly stops being used.
 *
 * Points at the FINAL destination, not at `/reports/favourites`. That address
 * was itself retired into `/reports/games`, so this used to be two hops — and a
 * redirect chain costs an extra round trip, drops the permanent-cache benefit
 * of the first hop, and breaks outright the day the middle link is cleaned up.
 */
export default function UserHubAnalyticsRedirect() {
  permanentRedirect('/reports/games');
}
