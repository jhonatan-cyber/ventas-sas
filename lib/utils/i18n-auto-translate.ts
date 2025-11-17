/**
 * Utilidad para traducción automática con next-intl
 * Traduce automáticamente cuando no existe una traducción
 */

'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { translateText } from '@/lib/services/translation/auto-translate-service'

/**
 * Hook que traduce automáticamente si no existe la traducción
 */
export function useAutoTranslate(locale: string) {
  const t = useTranslations()
  const [autoTranslations, setAutoTranslations] = useState<Map<string, string>>(new Map())

  const translate = async (key: string, params?: Record<string, string | number>): Promise<string> => {
    try {
      // Intentar obtener traducción existente
      const existingTranslation = t(key, params)
      
      // Si la traducción existe y no es igual a la clave, retornarla
      if (existingTranslation && existingTranslation !== key) {
        return existingTranslation
      }

      // Si no existe, verificar si ya la tradujimos antes
      if (autoTranslations.has(key)) {
        const cached = autoTranslations.get(key)!
        // Reemplazar parámetros si existen
        if (params) {
          return Object.entries(params).reduce(
            (text, [param, value]) => text.replace(`{{${param}}}`, String(value)),
            cached
          )
        }
        return cached
      }

      // Traducir automáticamente desde español (idioma base)
      const sourceText = key.split('.').pop() || key
      const translated = await translateText(sourceText, {
        sourceLanguage: 'es',
        targetLanguage: locale
      })

      // Guardar en cache local
      setAutoTranslations(prev => new Map(prev).set(key, translated))

      // Reemplazar parámetros si existen
      if (params) {
        return Object.entries(params).reduce(
          (text, [param, value]) => text.replace(`{{${param}}}`, String(value)),
          translated
        )
      }

      return translated
    } catch (error) {
      console.error('Error en traducción automática:', error)
      // En caso de error, retornar la clave o el texto original
      return key
    }
  }

  return { translate, t }
}


