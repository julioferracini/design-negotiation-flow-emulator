import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const NAV_EVENT = 'prototype-navigate';

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
    window.addEventListener(NAV_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAV_EVENT, sync);
    };
  }, [sync]);

  const navigate = useCallback(
    (url: string) => {
      const [path, qs] = url.split('?');
      const fullPath = `${BASE}${path}${qs ? `?${qs}` : ''}`;
      window.history.pushState({}, '', fullPath);
      window.dispatchEvent(new Event(NAV_EVENT));
    },
    [],
  );

  return { ...loc, navigate, sync };
}
