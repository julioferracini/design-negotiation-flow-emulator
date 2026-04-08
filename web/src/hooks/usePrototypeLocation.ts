import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  if (BASE && path.startsWith(BASE)) {
    return path.slice(BASE.length) || '/';
  }
  return path;
}

/**
 * Read the current URL once (no hooks) — safe to call during state initializers.
 * Returns the base-stripped pathname and raw search string.
 */
export function readInitialLocation(): { pathname: string; search: string } {
  if (typeof window === 'undefined') return { pathname: '/', search: '' };
  return {
    pathname: stripBase(window.location.pathname),
    search: window.location.search,
  };
}

export function usePrototypeLocation() {
  const read = () => ({
    pathname: typeof window !== 'undefined' ? stripBase(window.location.pathname) : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
  });

  const [loc, setLoc] = useState(read);

  const sync = useCallback(() => setLoc(read()), []);

  useEffect(() => {
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [sync]);

  const navigate = useCallback(
    (url: string) => {
      const [path, qs] = url.split('?');
      const fullPath = `${BASE}${path}${qs ? `?${qs}` : ''}`;
      window.history.pushState({}, '', fullPath);
      sync();
    },
    [sync],
  );

  return { ...loc, navigate, sync };
}
