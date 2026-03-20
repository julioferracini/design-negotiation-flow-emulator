/**
 * Map URL ?lang= values to app Locale (shared with Expo i18n).
 */

import type { Locale } from '../../../i18n/types';
import { SUPPORTED_LOCALES } from '@shared/types';

const LANG_ALIASES: Record<string, Locale> = {
  'pt-BR': 'pt-BR',
  pt: 'pt-BR',
  'es-MX': 'es-MX',
  'es-CO': 'es-CO',
  'en-US': 'en-US',
  en: 'en-US',
};

export function parseProtoLocale(lang: string | null | undefined): Locale {
  if (!lang) return 'pt-BR';
  const normalized = lang.trim();
  const direct = LANG_ALIASES[normalized];
  if (direct) return direct;
  if (SUPPORTED_LOCALES.includes(normalized as Locale)) return normalized as Locale;
  return 'pt-BR';
}
