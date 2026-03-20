import { useCallback, useEffect, useState } from 'react';

export function usePrototypeLocation() {
  const read = () => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
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
      window.history.pushState({}, '', url);
      sync();
    },
    [sync],
  );

  return { ...loc, navigate, sync };
}
