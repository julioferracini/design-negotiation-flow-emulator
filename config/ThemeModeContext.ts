import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeSegment = 'standard' | 'uv' | 'pj';

export type ThemeModeCtx = {
  mode: ThemeMode;
  toggle: () => void;
  segment: ThemeSegment;
  setSegment: (s: ThemeSegment) => void;
};

export const ThemeModeContext = createContext<ThemeModeCtx>({
  mode: 'light',
  toggle: () => {},
  segment: 'standard',
  setSegment: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);
