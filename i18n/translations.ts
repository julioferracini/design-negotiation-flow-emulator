/**
 * i18n/translations — Pure data layer (no React dependency).
 *
 * Contains translation maps, locale metadata, and helpers that work
 * in any JS runtime (Node, Vite, Expo, browser).
 *
 * For the React hook `useTranslation`, import from `i18n/index` instead.
 */

import type { Locale, Translations } from './types';
import ptBR from './pt-BR';
import esMX from './es-MX';
import esCO from './es-CO';
import enUS from './en-US';

export type { Locale, Translations };

const LANG_MAP: Record<Locale, Translations> = {
  'pt-BR': ptBR,
  'es-MX': esMX,
  'es-CO': esCO,
  'en-US': enUS,
};

export const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'es-MX', 'es-CO', 'en-US'];

export const LOCALE_FLAGS: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'es-MX': '🇲🇽',
  'es-CO': '🇨🇴',
  'en-US': '🇺🇸',
};

export const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'es-MX': 'Español (México)',
  'es-CO': 'Español (Colombia)',
  'en-US': 'English (US)',
};

export function getTranslations(locale: Locale): Translations {
  return LANG_MAP[locale] ?? ptBR;
}

export function interpolate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(variables[key] ?? `{${key}}`));
}
