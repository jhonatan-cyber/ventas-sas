/**
 * Utilidades para manejar descripciones de productos en múltiples idiomas
 * @deprecated Usar getTranslatableText de translatable-text.ts en su lugar
 */


export interface DescriptionTranslations {
  es?: string;
  en?: string;
  pt?: string;
}

/**
 * Obtiene la descripción del producto según el idioma actual
 * Si no existe traducción, usa la descripción original como fallback
 */
export function getProductDescription(
  description: string | null | undefined,
  translations: DescriptionTranslations | null | undefined,
  currentLanguage?: string
): string | null {
  // Si no hay descripción original ni traducciones, retornar null
  if (!description && !translations) {
    return null;
  }

  // Si no se proporciona el idioma actual, usar 'es' por defecto
  if (!currentLanguage) {
    currentLanguage = "es";
  }

  // Normalizar el idioma (asegurar que sea 'es', 'en' o 'pt')
  const lang = currentLanguage === "en" || currentLanguage === "pt" ? currentLanguage : "es";

  // Si hay traducción para el idioma actual, usarla
  if (translations && typeof translations === "object") {
    const translated = (translations as DescriptionTranslations)[lang as keyof DescriptionTranslations];
    if (translated && translated.trim()) {
      return translated;
    }
  }

  // Fallback: usar la descripción original
  return description || null;
}

/**
 * Traduce una descripción a todos los idiomas soportados
 */
export async function translateProductDescription(
  description: string,
  sourceLanguage: string = "es"
): Promise<DescriptionTranslations> {
  const translations: DescriptionTranslations = {};

  // Si la descripción está vacía, retornar objeto vacío
  if (!description || !description.trim()) {
    return translations;
  }

  // Si el idioma origen es español, guardarlo directamente
  if (sourceLanguage === "es") {
    translations.es = description;
  }

  // Traducir a inglés y portugués
  const languages = ["en", "pt"] as const;
  
  // Importar dinámicamente el servicio de traducción para evitar problemas de SSR
  const { translateText } = await import("@/lib/services/translation/auto-translate-service");

  for (const targetLang of languages) {
    try {
      // Solo traducir si el idioma destino es diferente al origen
      if (targetLang !== sourceLanguage) {
        const translated = await translateText(description, {
          sourceLanguage,
          targetLanguage: targetLang,
          useCache: true,
        });
        translations[targetLang] = translated;
      } else if (sourceLanguage === targetLang) {
        // Si el idioma origen coincide con el destino, guardarlo directamente
        translations[targetLang] = description;
      }
    } catch (error) {
      console.error(`Error traduciendo descripción a ${targetLang}:`, error);
      // Si falla la traducción, no agregar esa clave
    }
  }

  return translations;
}

