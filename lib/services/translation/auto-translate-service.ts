/**
 * Servicio de traducción automática
 * Traducción automática usando el provider unificado (Groq / DeepSeek / Ollama)
 */

import { chatCompleteWithOptions } from '@/lib/services/ai/provider'
import { buildTranslatePrompt } from '@/lib/services/ai/prompts'

// Cache en memoria para evitar traducciones repetidas
const translationCache = new Map<string, string>()

interface TranslateOptions {
  sourceLanguage?: string
  targetLanguage: string
  useCache?: boolean
}

/**
 * Función helper para hacer delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Traduce un texto usando Google Translate API con retry automático
 */
export async function translateText(
  text: string,
  options: TranslateOptions
): Promise<string> {
  const { sourceLanguage = 'es', targetLanguage, useCache = true } = options

  // Si el idioma origen y destino son iguales, retornar el texto original
  if (sourceLanguage === targetLanguage) {
    return text
  }

  // Verificar cache
  const cacheKey = `${sourceLanguage}:${targetLanguage}:${text}`
  if (useCache && translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  // Construir prompt seguro (mantener placeholders y números)
  const prompt = buildTranslatePrompt({ text, lang: targetLanguage })

  // Retry con backoff exponencial para manejar rate limits
  const maxRetries = 5
  let retryDelay = 1000 // 1 segundo inicial
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const translatedText = await chatCompleteWithOptions(
        [{ role: 'user', content: prompt }],
        {
          // Preferir Groq en producción por costo/velocidad; fallback ya está activo en provider
          model: 'llama-3.1-8b-instant',
          temperature: 0.1
        }
      )

      // Guardar en cache
      if (useCache) {
        translationCache.set(cacheKey, translatedText)
      }

      return translatedText
    } catch (error: any) {
      // Si es error de cuota (429), esperar y reintentar
      const status = error?.status || error?.statusCode
      if (status === 429) {
        const retryAfter = error?.details?.[0]?.retryDelay 
          ? parseInt(error.details[0].retryDelay) * 1000 
          : retryDelay
        
        if (attempt < maxRetries - 1) {
          console.warn(`⚠️  Cuota excedida, esperando ${Math.ceil(retryAfter / 1000)}s antes de reintentar...`)
          await delay(retryAfter)
          retryDelay = Math.min(retryDelay * 2, 60000) // Max 60 segundos
          continue
        }
      }
      
      // Si no es error de cuota o se agotaron los reintentos
      if (attempt === maxRetries - 1) {
        console.error('Error en traducción automática después de múltiples intentos:', error)
        return text
      }
      
      // Para otros errores, esperar un poco y reintentar
      await delay(retryDelay)
      retryDelay = Math.min(retryDelay * 2, 60000)
    }
  }

  return text
}

/**
 * Traduce un objeto completo de traducciones con rate limiting
 */
export async function translateObject(
  sourceObject: Record<string, any>,
  sourceLanguage: string,
  targetLanguage: string,
  options?: {
    delayBetweenRequests?: number // Delay en ms entre solicitudes (default: 7000ms para respetar 10/min)
    onProgress?: (current: number, total: number) => void
  }
): Promise<Record<string, any>> {
  const { delayBetweenRequests = 7000, onProgress } = options || {}

  // Contar total de strings a traducir para mostrar progreso
  const countStrings = (obj: Record<string, any>): number => {
    let count = 0
    for (const value of Object.values(obj)) {
      if (typeof value === 'string') {
        count++
      } else if (typeof value === 'object' && value !== null) {
        count += countStrings(value)
      }
    }
    return count
  }

  const totalStrings = countStrings(sourceObject)
  let currentCount = 0

  const translateRecursive = async (
    obj: Record<string, any>
  ): Promise<Record<string, any>> => {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Traducir string con delay para respetar rate limits
        if (currentCount > 0) {
          await delay(delayBetweenRequests)
        }
        
        result[key] = await translateText(value, {
          sourceLanguage,
          targetLanguage
        })
        
        currentCount++
        if (onProgress) {
          onProgress(currentCount, totalStrings)
        }
      } else if (typeof value === 'object' && value !== null) {
        // Traducir objeto anidado recursivamente
        result[key] = await translateRecursive(value)
      } else {
        // Mantener otros tipos sin cambios
        result[key] = value
      }
    }

    return result
  }

  return await translateRecursive(sourceObject)
}

/**
 * Limpia el cache de traducciones
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

