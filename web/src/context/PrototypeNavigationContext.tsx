import { createContext, useContext } from 'react';

export type PrototypeNavigate = (url: string) => void;

const PrototypeNavigationContext = createContext<PrototypeNavigate | null>(null);

export function PrototypeNavigationProvider({
  navigate,
  children,
}: {
  navigate: PrototypeNavigate;
  children: React.ReactNode;
}) {
  return (
    <PrototypeNavigationContext.Provider value={navigate}>
      {children}
    </PrototypeNavigationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrototypeNavigate(): PrototypeNavigate {
  const ctx = useContext(PrototypeNavigationContext);
  if (!ctx) {
    return () => {};
  }
  return ctx;
}
