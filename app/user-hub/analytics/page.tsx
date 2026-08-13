import { permanentRedirect } from 'next/navigation';

/**
 * Favourites analytics moved to /reports/favourites.
 *
 * The redirect stays because this URL is bookmarked and linked from outside the
 * app; a moved page that 404s teaches people the report is gone rather than
 * that it is somewhere better. Permanent, so it is cached and the old address
 * quietly stops being used.
 */
export default function UserHubAnalyticsRedirect() {
  permanentRedirect('/reports/favourites');
}
