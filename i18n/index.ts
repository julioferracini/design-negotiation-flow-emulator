/**
 * i18n — Full translation module (includes React hook).
 *
 * Re-exports everything from `translations.ts` (pure data) and adds
 * the `useTranslation` React hook for Expo / React Native screens.
 *
 * Web screens that run without the root node_modules should import
 * from `i18n/translations` directly to avoid the React dependency.
 */

import { useMemo } from 'react';
import { getTranslations } from './translations';

export type { Locale, Translations } from './translations';
export {
  SUPPORTED_LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  getTranslations,
  interpolate,
} from './translations';

export function useTranslation(locale: Parameters<typeof getTranslations>[0]) {
  return useMemo(() => getTranslations(locale), [locale]);
}
