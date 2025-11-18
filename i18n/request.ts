import { getRequestConfig } from "next-intl/server";

// Idiomas soportados
export const locales = ["es", "en", "pt"] as const;
export type Locale = (typeof locales)[number];

// Idioma por defecto
export const defaultLocale: Locale = "es";

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale desde la request
  // Como usamos un provider personalizado que lee desde las preferencias,
  // aquí simplemente validamos el locale
  let locale = await requestLocale;

  // Validar que el locale sea válido
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale: locale as Locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'America/La_Paz',
  };
});

