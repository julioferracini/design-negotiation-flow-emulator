/**
 * i18n — Full translation module (includes React hook).
 *
 * Re-exports everything from shared/i18n (pure data) and adds
 * the `useTranslation` React hook for Expo / React Native screens.
 *
 * Web screens should import from @shared/i18n directly to avoid
 * the React dependency at build time.
 */

import { useMemo } from 'react';
import { getTranslations } from '../shared/i18n';

export type { Locale, Translations } from '../shared/i18n';
export {
  SUPPORTED_LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  getTranslations,
  interpolate,
} from '../shared/i18n';

export function useTranslation(locale: Parameters<typeof getTranslations>[0]) {
  return useMemo(() => getTranslations(locale), [locale]);
}
