// Supported locales
export const locales = ['de', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';
