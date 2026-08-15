/** @type {import('next').NextConfig} */
const nextConfig = {
  // Session length folded into /reports/games — it was answering the same
  // question the games table already ranks by. Permanent, because the old path
  // is in bookmarks and in older report links; a 404 there just looks broken.
  async redirects() {
    return [
      { source: '/reports/duration', destination: '/reports/games', permanent: true },
      // Folded into Games (#1474 R4): the unfinished pool and the favourites
      // panel both answer per-game questions and did not need a destination each.
      { source: '/reports/unfinished', destination: '/reports/games', permanent: true },
      { source: '/reports/favourites', destination: '/reports/games', permanent: true },
      // Patterns is gone rather than folded: play-by-hour is noise at this
      // volume. It's one useful panel, new vs returning, is on the overview.
      { source: '/reports/patterns', destination: '/reports', permanent: true },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
