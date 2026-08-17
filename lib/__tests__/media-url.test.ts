import { describe, expect, it } from 'vitest';
import config from '@/lib/config';
import { mediaUrl } from '@/lib/media-url';

describe('mediaUrl', () => {
  it('resolves a relative media path against the API, not this app', () => {
    // The whole reason this exists: the dashboard and the API are different
    // origins, so `/media/...` rendered as-is asks THIS app for the image.
    expect(mediaUrl('/media/team_badges/united.svg')).toBe(
      `${config.API_BASE_URL}/media/team_badges/united.svg`,
    );
  });

  it('leaves an already-absolute URL alone', () => {
    // The backend sends absolute URLs now. Prefixing them again would produce
    // `https://api.example.com/https://api.example.com/media/...`.
    const absolute = 'https://api.extratime.world/media/nation_flags/england-flag.png';

    expect(mediaUrl(absolute)).toBe(absolute);
    expect(mediaUrl('http://localhost:8000/media/x.png')).toBe('http://localhost:8000/media/x.png');
  });

  it('leaves a protocol-relative or inline URL alone', () => {
    // What a CDN move would produce, and what an inline SVG placeholder is.
    expect(mediaUrl('//cdn.example.com/badge.svg')).toBe('//cdn.example.com/badge.svg');
    expect(mediaUrl('data:image/svg+xml,<svg/>')).toBe('data:image/svg+xml,<svg/>');
  });

  it('treats absent as absent', () => {
    // 91.5% of teams have no badge, so this is the ordinary path, and it has to
    // stay null rather than becoming a URL that 404s.
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });
});
