import { apiFetcher } from '@/lib/api-fetcher';
import { useAuth } from '@/lib/auth';

type ApiOptions = {
  headers?: Record<string, string>;
} & RequestInit;

/**
 * Custom hook for making authenticated API requests
 */
export function useApi() {
  const { logout } = useAuth();

  const apiCall = async (url: string, options?: ApiOptions) => {
    try {
      return await apiFetcher(url, options);
    } catch (error) {
      // If the error indicates session expiry, log out the user
      if (error instanceof Error && error.message.includes('Session expired')) {
        await logout();
      }
      throw error;
    }
  };

  return { apiCall };
}
