/** @type {import('next').NextConfig} */
const nextConfig = {
  // Session length folded into /reports/games — it was answering the same
  // question the games table already ranks by. Permanent, because the old path
  // is in bookmarks and in older report links; a 404 there just looks broken.
  async redirects() {
    return [
      { source: '/reports/duration', destination: '/reports/games', permanent: true },
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
