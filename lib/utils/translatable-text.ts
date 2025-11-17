/**
 * Utilidades para manejar textos traducibles (descripciones, notas, etc.) en múltiples idiomas
 */

import { readPreferences } from "./preferences";

export interface TextTranslations {
  es?: string;
  en?: string;
  pt?: string;
}

/**
 * Obtiene un texto traducible según el idioma actual
 * Si no existe traducción, usa el texto original como fallback
 */
export function getTranslatableText(
  originalText: string | null | undefined,
  translations: TextTranslations | null | undefined,
  currentLanguage?: string
): string | null {
  // Si no hay texto original ni traducciones, retornar null
  if (!originalText && !translations) {
    return null;
  }

  // Si no se proporciona el idioma actual, intentar obtenerlo de las preferencias
  if (!currentLanguage) {
    try {
      const prefs = readPreferences();
      currentLanguage = prefs?.language || "es";
    } catch {
      currentLanguage = "es";
    }
  }

  // Normalizar el idioma (asegurar que sea 'es', 'en' o 'pt')
  const lang = currentLanguage === "en" || currentLanguage === "pt" ? currentLanguage : "es";

  // Si hay traducción para el idioma actual, usarla
  if (translations && typeof translations === "object") {
    const translated = (translations as TextTranslations)[lang as keyof TextTranslations];
    if (translated && translated.trim()) {
      return translated;
    }
  }

  // Fallback: usar el texto original
  return originalText || null;
}

/**
 * Traduce un texto a todos los idiomas soportados
 */
export async function translateText(
  text: string,
  sourceLanguage: string = "es"
): Promise<TextTranslations> {
  const translations: TextTranslations = {};

  // Si el texto está vacío, retornar objeto vacío
  if (!text || !text.trim()) {
    return translations;
  }

  // Si el idioma origen es español, guardarlo directamente
  if (sourceLanguage === "es") {
    translations.es = text;
  }

  // Traducir a inglés y portugués
  const languages = ["en", "pt"] as const;
  
  // Importar dinámicamente el servicio de traducción para evitar problemas de SSR
  const { translateText: translateTextService } = await import("@/lib/services/translation/auto-translate-service");

  for (const targetLang of languages) {
    try {
      // Solo traducir si el idioma destino es diferente al origen
      if (targetLang !== sourceLanguage) {
        const translated = await translateTextService(text, {
          sourceLanguage,
          targetLanguage: targetLang,
          useCache: true,
        });
        translations[targetLang] = translated;
      } else if (sourceLanguage === targetLang) {
        // Si el idioma origen coincide con el destino, guardarlo directamente
        translations[targetLang] = text;
      }
    } catch (error) {
      console.error(`Error traduciendo texto a ${targetLang}:`, error);
      // Si falla la traducción, no agregar esa clave
    }
  }

  return translations;
}

