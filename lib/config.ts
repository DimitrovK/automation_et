// Configuration utility for environment variables
const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.extratime.world',

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
