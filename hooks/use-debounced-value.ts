import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delay` ms.
 *
 * Used by the team-players autocomplete (search-by-name) and the
 * free-text player filter so we don't slam the API on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
