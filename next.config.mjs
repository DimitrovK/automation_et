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
      // Grid's behaviour and content pages became one dashboard (grid dashboard, 2026-10-17).
      { source: '/reports/games/grid', destination: '/games/grid', permanent: true },
      { source: '/analytics/grid', destination: '/games/grid', permanent: true },
      // Needs attention was removed: it flagged noise more than news at this volume.
      { source: '/reports/anomalies', destination: '/reports', permanent: true },
      // Insights (2026-10-17): the one-card football-data overview folded into Footballers,
      // and the old questions URL moved here from a redirect-only page.
      { source: '/analytics/football-data', destination: '/analytics/football-data/footballers', permanent: true },
      { source: '/analytics/questions', destination: '/analytics/football-data/questions', permanent: true },
      // One page per game (Insights phase 2): behaviour and content in one place.
      { source: '/reports/games/:key', destination: '/games/:key', permanent: true },
      { source: '/analytics/career-path', destination: '/games/career_path', permanent: true },
      { source: '/analytics/lineups', destination: '/games/missing11', permanent: true },
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
