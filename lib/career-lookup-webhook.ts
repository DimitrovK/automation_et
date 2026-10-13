import config from '@/lib/config';

/**
 * Calls the n8n career-lookup webhook as the signed-in staff member.
 *
 * The webhook lets nobody in without an ExtraTime staff token (FootballExtraTime/App#2068): n8n
 * asks the backend whose token it is, and uses the same token for its own backend calls. So the
 * token goes in the `Authorization` header here, and an expired one is refreshed once.
 *
 * The token is only ever sent to the webhook this app is configured for (or to a local n8n).
 * The URL can be changed in the connection settings, and a token must not follow it anywhere else.
 */

export const CAREER_LOOKUP_SIGN_IN_MESSAGE = 'The career lookup needs a staff sign-in. Sign out and sign in again with a staff account.';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function mayReceiveToken(webhookUrl: string): boolean {
  try {
    const target = new URL(webhookUrl);
    return target.origin === new URL(config.N8N_WEBHOOK_URL).origin || LOCAL_HOSTS.has(target.hostname);
  } catch {
    return false;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    return null;
  }
  const response = await fetch(config.getApiUrl('token/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    return null;
  }
  const { access } = await response.json();
  localStorage.setItem('token', access);
  return access;
}

export async function postCareerLookup(webhookUrl: string, body: Record<string, string | undefined>, signal?: AbortSignal): Promise<Response> {
  const withToken = mayReceiveToken(webhookUrl);
  const send = (token: string | null) => fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(withToken && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal,
    mode: 'cors',
  });

  let response = await send(localStorage.getItem('token'));
  if (response.status === 401 && withToken) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      response = await send(fresh);
    }
  }
  if (response.status === 401) {
    throw new Error(CAREER_LOOKUP_SIGN_IN_MESSAGE);
  }
  return response;
}
