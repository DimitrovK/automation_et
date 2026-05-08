// Configuration utility for environment variables.
//
// API base URL precedence:
//   1. `NEXT_PUBLIC_API_BASE_URL` if set (e.g. via `.env.local`).
//   2. `http://localhost:8000` when running `next dev` so the
//      automation app talks to a local Django by default.
//   3. The hosted prod API for production builds.
const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://api.extratime.world';

const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,

  // N8N Configuration
  N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.extratime.world/webhook/footballer-career',

  // Admin Configuration
  ADMIN_BASE_URL: process.env.NEXT_PUBLIC_ADMIN_BASE_URL || 'https://api.extratime.world/admin/',

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Helper methods
  getApiUrl: (endpoint = '') => {
    const baseUrl = config.API_BASE_URL.endsWith('/') ? config.API_BASE_URL.slice(0, -1) : config.API_BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  },

  getAdminUrl: (path = '') => {
    const baseUrl = config.ADMIN_BASE_URL.endsWith('/') ? config.ADMIN_BASE_URL : `${config.ADMIN_BASE_URL}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}${cleanPath}`;
  },

  getDiscordToken: () => {
    return process.env.NEXT_PUBLIC_DISCORD_BOT_TOKEN || '';
  },

  isDiscordTokenConfigured: () => {
    return !!process.env.NEXT_PUBLIC_DISCORD_BOT_TOKEN;
  },
} as const;

export default config;
