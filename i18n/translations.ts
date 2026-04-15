/**
 * Proxy — canonical source is now shared/i18n/translations.ts
 *
 * Kept for backwards compatibility with existing imports.
 * Prefer importing from shared/i18n directly:
 *   import { getTranslations } from '@shared/i18n';   // web
 *   import { getTranslations } from '../shared/i18n'; // Expo / config
 */
export * from '../shared/i18n/translations';
