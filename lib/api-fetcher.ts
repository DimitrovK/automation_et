import config from '@/lib/config';

type ApiOptions = {
  headers?: Record<string, string>;
} & RequestInit;

/**
 * API fetcher with automatic JWT token handling and refresh
 *
 * Generic so call sites can do `apiFetcher<MyResponse>(url)` and skip the
 * `as MyResponse` cast. Defaults to `any` to preserve the previous
 * behaviour for untyped callers — new code should pass an explicit `T`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetcher<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

  async function executeRequest(): Promise<Response> {
    return fetch(config.getApiUrl(url), {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(url.startsWith('auth/') || !token
          ? {}
          : { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    });
  }

  let response = await executeRequest();

  // Handle token refresh on 401 unauthorized
  if (response.status === 401 && token && refreshToken) {
    try {
      const refreshResponse = await fetch(config.getApiUrl('auth/token/refresh/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const { access } = await refreshResponse.json();
        localStorage.setItem('token', access);

        // Retry the original request with new token
        response = await executeRequest();
      } else {
        // Refresh failed, clear tokens and notify app
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('session-expired'));
        throw new Error('Session expired. Please log in again.');
      }
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('session-expired'));
      throw error;
    }
  }

  if (!response.ok) {
    const method = (options.method || 'GET').toUpperCase();
    let errorMessage = `HTTP ${response.status}: ${response.statusText} (${method} ${url})`;

    try {
      const errorData = await response.json();

      // Handle Django's non_field_errors format
      if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        errorMessage = errorData.non_field_errors[0];
      } else if (errorData.detail) {
        // Handle Django's detail field (common for DRF)
        errorMessage = errorData.detail;
      } else if (errorData.error) {
        // Handle other Django error formats
        errorMessage = errorData.error;
      } else if (errorData.username && Array.isArray(errorData.username)) {
        // Handle field-specific errors for login
        errorMessage = `Username: ${errorData.username[0]}`;
      } else if (errorData.password && Array.isArray(errorData.password)) {
        errorMessage = `Password: ${errorData.password[0]}`;
      } else if (errorData.email && Array.isArray(errorData.email)) {
        // Handle common authentication errors
        errorMessage = `Email: ${errorData.email[0]}`;
      } else {
        // If we have any other structure, try to extract a meaningful message
        // Try to find any error message in the response
        const allErrors = [];
        for (const [_key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            allErrors.push(...value);
          } else if (typeof value === 'string') {
            allErrors.push(value);
          }
        }

        if (allErrors.length > 0) {
          errorMessage = allErrors[0];
        }
      }
    } catch (parseError) {
      // If we can't parse the error response, use the default message
      // Keep this console.warn as it's useful for debugging API issues in production
      console.warn('Failed to parse error response:', parseError);
    }

    throw new Error(errorMessage);
  }

  // Check if response has content before trying to parse JSON
  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');

  // If no content (204 status or empty response), return null
  if (response.status === 204 || contentLength === '0') {
    return null as T;
  }

  // If response doesn't contain JSON, return null
  if (!contentType || !contentType.includes('application/json')) {
    return null as T;
  }

  // Try to parse JSON, return null if parsing fails (empty response)
  try {
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
    return null as T;
  }
}
