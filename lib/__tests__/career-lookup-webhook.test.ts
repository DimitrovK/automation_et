import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAREER_LOOKUP_SIGN_IN_MESSAGE, postCareerLookup } from '@/lib/career-lookup-webhook';
import config from '@/lib/config';

const answer = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('postCareerLookup', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'access-1');
    localStorage.setItem('refresh_token', 'refresh-1');
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('sends the staff token to the configured webhook, and to no other address', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(answer(200)));
    vi.stubGlobal('fetch', fetchMock);

    await postCareerLookup(config.N8N_WEBHOOK_URL, { name: 'Andrea Pirlo' });
    await postCareerLookup('https://elsewhere.example/webhook/footballer-career', { name: 'Andrea Pirlo' });

    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe('Bearer access-1');
    expect(fetchMock.mock.calls[1]![1].headers.Authorization).toBeUndefined();
  });

  it('refreshes an expired token once and sends the lookup again', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(answer(401))
      .mockResolvedValueOnce(answer(200, { access: 'access-2' }))
      .mockResolvedValueOnce(answer(200, { playerName: 'Andrea Pirlo' }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await postCareerLookup(config.N8N_WEBHOOK_URL, { name: 'Andrea Pirlo' });

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[1]![0]).toBe(config.getApiUrl('token/refresh/'));
    expect(fetchMock.mock.calls[2]![1].headers.Authorization).toBe('Bearer access-2');
    expect(localStorage.getItem('token')).toBe('access-2');
  });

  it('says to sign in as staff when the webhook still refuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(answer(401))));

    await expect(postCareerLookup(config.N8N_WEBHOOK_URL, { name: 'Andrea Pirlo' })).rejects.toThrow(CAREER_LOOKUP_SIGN_IN_MESSAGE);
  });
});
