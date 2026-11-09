import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import type { Locale } from '../music/notes';

export const SUPPORTED: Locale[] = ['en', 'es', 'pt'];

/** Idioma del teléfono si es uno de los 3; si no, inglés. */
export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED as string[]).includes(code) ? (code as Locale) : 'en';
}

export function initI18n(locale: Locale) {
  if (i18n.isInitialized) {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    return i18n;
  }
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, es: { translation: es }, pt: { translation: pt } },
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

/**
 * Resuelve una opción de ejercicio: las que empiezan con '=' son literales
 * (por ejemplo '=E' o '=3'); el resto son claves de traducción.
 */
export function optionLabel(t: (k: string) => string, option: string): string {
  return option.startsWith('=') ? option.slice(1) : t(option);
}

export default i18n;
