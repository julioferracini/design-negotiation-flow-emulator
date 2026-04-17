/**
 * shared/i18n — Platform-agnostic translation layer.
 *
 * Pure data: no React, no React Native.
 * Safe to import in Vite (web), Expo, Node scripts, and tests.
 *
 * For the React hook `useTranslation`, import from the root `i18n/` module:
 *   import { useTranslation } from '../../i18n';          // from Expo screens
 *   import { getTranslations } from '@shared/i18n';        // from web screens
 */

export type { Locale } from '../types';
export type { Translations, ScreenEntry, UseCaseEntry } from './types';
export {
  SUPPORTED_LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  getTranslations,
  interpolate,
} from './translations';
