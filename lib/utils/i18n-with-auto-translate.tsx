/**
 * Wrapper para next-intl con traducción automática
 * Traduce automáticamente cuando no existe una traducción
 */

'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'

/**
 * Hook que combina next-intl con traducción automática
 * Si no existe una traducción, la traduce automáticamente desde español
 */
export function useTranslationsWithAuto() {
  const t = useTranslations()
  const locale = useLocale()
  const [autoTranslations, setAutoTranslations] = useState<Map<string, string>>(new Map())

  const translate = async (key: string, params?: Record<string, string | number>): Promise<string> => {
    // Si el locale es español, usar traducción normal
    if (locale === 'es') {
      return t(key, params)
    }

    // Intentar obtener traducción existente
    try {
      const existing = t(key, params)
      // Si la traducción existe y no es igual a la clave, retornarla
      if (existing && existing !== key && !existing.startsWith('[')) {
        return existing
      }
    } catch {
      // Si falla, continuar con traducción automática
    }

    // Si no existe, traducir automáticamente
    // Extraer el texto base de la clave (última parte)
    const textToTranslate = key.split('.').pop() || key
    
    // Verificar cache
    const cacheKey = `${locale}:${textToTranslate}`
    if (autoTranslations.has(cacheKey)) {
      const cached = autoTranslations.get(cacheKey)!
      if (params) {
        return Object.entries(params).reduce(
          (text, [param, value]) => text.replace(`{{${param}}}`, String(value)),
          cached
        )
      }
      return cached
    }

    // Traducir usando la API
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLanguage: 'es',
          targetLanguage: locale
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.translated) {
          const translated = data.translated
          // Guardar en cache
          setAutoTranslations(prev => {
            const newMap = new Map(prev)
            newMap.set(cacheKey, translated)
            return newMap
          })
          
          // Reemplazar parámetros si existen
          if (params) {
            return Object.entries(params).reduce(
              (text, [param, value]) => text.replace(`{{${param}}}`, String(value)),
              translated
            )
          }
          return translated
        }
      }
    } catch (error) {
      console.error('Error en traducción automática:', error)
    }

    // Fallback: intentar obtener desde español
    try {
      return t(key, params)
    } catch {
      return key
    }
  }

  return {
    t: translate,
    locale
  }
}

