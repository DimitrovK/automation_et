import config from '@/lib/config';

/** Already a location a browser can fetch, rather than a path on the API. */
const ALREADY_ABSOLUTE = /^(?:https?:)?\/\/|^data:/i;

/**
 * A media path from the API, as a URL this app can actually load.
 *
 * The dashboard and the API are separate origins, so a bare `/media/badge.svg`
 * in an `<img src>` asks the DASHBOARD for the image and gets a 404. Django's
 * `FileField.url` is relative by default, and while the analytics endpoint now
 * wraps these in `build_absolute_uri`, that is one serializer's decision — not
 * a property of the field. Resolving here means the UI renders correctly under
 * either, and survives a later move to a CDN.
 *
 * Absent stays absent. Only 8.5% of teams carry a badge, so a null is the
 * ordinary answer and the caller has to render something else regardless.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (ALREADY_ABSOLUTE.test(path)) {
    return path;
  }
  return config.getApiUrl(path);
}
