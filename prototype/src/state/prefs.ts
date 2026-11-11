import { reactive } from 'vue';

/** The signed-in user's own preferences. The demo keeps them for the session. */
export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
] as const;
export type LanguageId = (typeof LANGUAGES)[number]['id'];

export const prefs = reactive({ language: 'en' as LanguageId });

export const languageLabel = (id: LanguageId) => LANGUAGES.find((l) => l.id === id)?.label ?? id;
