import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales:       ['es', 'en'],
  defaultLocale: 'es',
  localePrefix:  'as-needed', // Español en /, Inglés en /en/
});
