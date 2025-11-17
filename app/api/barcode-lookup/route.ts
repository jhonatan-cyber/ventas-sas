import { NextRequest, NextResponse } from 'next/server'

import { buildExtractJsonPrompt, buildProductDescriptionPrompt } from '@/lib/services/ai/prompts'
import { chatCompleteWithOptions } from '@/lib/services/ai/provider'

function shortenProductName(name: string, maxLength = 50): string {
  if (!name) {
    return name
  }

  let normalized = name.replace(/\s+/g, ' ').trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  // Eliminar contenido entre paréntesis para reducir ruido
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  // Intentar cortar después de delimitadores comunes
  const delimiters = [' - ', ' | ', ' – ', ' — ', ': ']
  for (const delimiter of delimiters) {
    const index = normalized.indexOf(delimiter)
    if (index > 0 && index <= maxLength) {
      return normalized.slice(0, index).trim()
    }
  }

  // Construir un nombre corto manteniendo las primeras palabras descriptivas
  const words = normalized.split(' ')
  const shortWords: string[] = []
  const isLikelyBrand = (word: string) => {
    const cleaned = word.replace(/[^A-Za-zÁÉÍÓÚÜÑ]/g, '')
    return cleaned.length >= 3 && cleaned === cleaned.toUpperCase()
  }

  for (const word of words) {
    if (shortWords.length >= 3 && isLikelyBrand(word)) {
      break
    }

    const candidate = [...shortWords, word].join(' ')
    if (candidate.length > maxLength) {
      break
    }

    shortWords.push(word)
  }

  if (shortWords.length >= 2) {
    return shortWords.join(' ').replace(/[,\-:;]+$/, '').trim()
  }

  // Fallback: truncar y añadir "..." si no se pudo generar un nombre corto descriptivo
  if (normalized.length > maxLength) {
    return normalized.slice(0, maxLength - 3).trimEnd() + '...'
  }

  return normalized
}

// Función para mejorar información del producto con IA
async function enhanceProductInfoWithAI(
  productName: string,
  existingBrand: string | null,
  existingModel: string | null,
  existingDescription: string | null
): Promise<{ name?: string; brand?: string | null; model?: string | null; description?: string | null; imageUrl?: string | null } | null> {
  try {
    // Acortar el nombre si es muy largo (más de 60 caracteres)
    let shortenedName = shortenProductName(productName)
    if (productName.length > 60) {
      try {
        const shortenPrompt = [
          "Acorta el siguiente nombre de producto manteniendo marca y modelo si existen.",
          "Máximo 60 caracteres. Devuelve solo el nombre, sin explicaciones.",
          `Nombre: ${productName}`
        ].join('\n')
        const shortened = await chatCompleteWithOptions([{ role: 'user', content: shortenPrompt }], {
          temperature: 0.2,
        })
        if (shortened && shortened.length > 0 && shortened.length <= 70) {
          shortenedName = shortened.trim()
        }
      } catch (error) {
        console.error("Error al acortar nombre con IA:", error)
        // Si falla, mantener el nombre original
      }
    }
    
    // Extraer marca y modelo del nombre si no existen
    let brand = existingBrand
    let model = existingModel
    
    if (!brand || !model) {
      try {
        const extractPrompt = buildExtractJsonPrompt({ text: productName })
        const text = await chatCompleteWithOptions([{ role: 'user', content: extractPrompt }], { temperature: 0.1 })
        const jsonMatch = text?.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (!brand && parsed.brand && parsed.brand !== 'null') brand = String(parsed.brand).trim()
          if (!model && parsed.model && parsed.model !== 'null') model = String(parsed.model).trim()
        }
      } catch (error) {
        console.error("Error al extraer marca/modelo con IA:", error)
      }
    }
    
    // Generar descripción si no existe o es muy corta
    let description = existingDescription
    if (!description || description.length < 20) {
      try {
        const prompt = buildProductDescriptionPrompt({ name: productName, brand: brand || null, category: null, features: null })
        const enhancedPrompt =
          prompt +
          (model ? `\nModelo: ${model}` : '') +
          (existingDescription ? `\nDescripción existente (mejórala manteniendo la intención): ${existingDescription}` : '')
        description = await chatCompleteWithOptions([{ role: 'user', content: enhancedPrompt }], { temperature: 0.4 })
      } catch (error) {
        console.error("Error al generar descripción con IA:", error)
      }
    }
    
    // Buscar imagen si no existe
    let imageUrl = null
    if (!imageUrl) {
      const productInfo = await (await import('@/lib/services/ai/gemini-service')).GeminiService.searchProductInfo(productName, brand || null, model || null)
      imageUrl = productInfo.imageUrl
      // Actualizar marca y modelo si se encontraron mejores valores
      if (!brand && productInfo.brand) {
        brand = productInfo.brand
      }
      if (!model && productInfo.model) {
        model = productInfo.model
      }
    }
    
    return {
      name: shortenedName !== productName ? shortenedName : undefined,
      brand: brand || null,
      model: model || null,
      description: description || null,
      imageUrl: imageUrl || null
    }
  } catch (error) {
    console.error("Error al mejorar información con IA:", error)
    return null
  }
}

// Función para traducir texto al español
async function translateToSpanish(text: string | null | undefined): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null
  }

  // Detectar si el texto parece estar ya en español con más confianza
  // Buscar múltiples indicadores de español
  const spanishChars = /[áéíóúñÁÉÍÓÚÑüÜ]/.test(text)
  const commonSpanishWords = /\b(el|la|los|las|de|del|y|o|en|un|una|es|son|con|por|para|que|está|están|producto|descripción|características)\b/i.test(text)
  
  // Solo saltar traducción si hay múltiples indicadores de español
  if (spanishChars && commonSpanishWords) {
    return text
  }

  try {
    // Usar MyMemory Translation API (gratuita, no requiere API key)
    // Intentar traducir desde inglés primero (más común en productos)
    let response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    
    let data = await response.json()
    
    // Verificar si la traducción funcionó
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText.trim()
      // Solo usar la traducción si es diferente al texto original
      if (translated && 
          translated.toLowerCase() !== text.toLowerCase() && 
          translated !== text) {
        return translated
      }
    }
    
    // Si en|es no funcionó, intentar con auto|es para detectar el idioma
    response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|es`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    
    data = await response.json()
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText.trim()
      if (translated && 
          translated.toLowerCase() !== text.toLowerCase() && 
          translated !== text) {
        return translated
      }
    }
    
    // Si ambas fallan, retornar el texto original
    console.log('No se pudo traducir el texto:', text)
    return text
  } catch (error) {
    console.error('Error al traducir:', error)
    // Si falla la traducción, retornar el texto original
    return text
  }
}

// POST - Buscar información de producto por código de barras
export async function POST(request: NextRequest) {
  try {
    const { barcode } = await request.json()

    if (!barcode) {
      return NextResponse.json(
        { error: 'Código de barras requerido' },
        { status: 400 }
      )
    }

    // Intentar primero con UPCitemdb (más general - cámaras, routers, electrónicos, etc.)
    try {
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('UPCitemdb request failed')
      }

      const data = await response.json()

      if (data.code === "OK" && data.items && data.items.length > 0) {
        const item = data.items[0]
        const description = item.description || item.title
        
        // Traducir descripción al español
        const translatedDescription = await translateToSpanish(description)
        
        const result = {
          success: true,
          source: 'upcitemdb',
          data: {
            name: shortenProductName(item.title),
            brand: item.brand,
            model: item.model,
            description: translatedDescription || description,
            imageUrl: item.images && item.images.length > 0 ? item.images[0] : null
          }
        }
        
        // Si falta información importante, intentar completarla con IA
        const needsEnhancement = !result.data.description || !result.data.imageUrl || (!result.data.brand && !result.data.model)
        if (needsEnhancement && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          try {
            const enhanced = await enhanceProductInfoWithAI(result.data.name, result.data.brand, result.data.model, result.data.description)
            if (enhanced) {
              result.data = { ...result.data, ...enhanced }
              result.source = 'upcitemdb_enhanced_ai'
            }
          } catch (error) {
            console.error("Error al mejorar información con IA:", error)
          }
        }
        
        return NextResponse.json(result)
      }
    } catch {
      console.log("UPCitemdb no encontró el producto, intentando OpenFoodFacts...")
    }

    // Si UPCitemdb no encontró nada, intentar con OpenFoodFacts (productos alimentarios)
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      )

      if (!response.ok) {
        throw new Error('OpenFoodFacts request failed')
      }

      const data = await response.json()

      if (data.status === 1 && data.product) {
        const product = data.product
        const description = product.generic_name
        
        // Traducir descripción al español
        const translatedDescription = await translateToSpanish(description)
        
        const result: {
          success: boolean
          source: string
          data: {
            name: string
            brand: string | null
            model: string | null
            description: string | null
            imageUrl: string | null
          }
        } = {
          success: true,
          source: 'openfoodfacts',
          data: {
            name: shortenProductName(product.product_name),
            brand: product.brands ? product.brands.split(",")[0].trim() : null,
            model: null,
            description: translatedDescription || description,
            imageUrl: product.image_url || null
          }
        }
        
        // Si falta información importante, intentar completarla con IA
        const needsEnhancement = !result.data.description || !result.data.imageUrl || !result.data.brand
        if (needsEnhancement && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          try {
            const enhanced = await enhanceProductInfoWithAI(result.data.name, result.data.brand, result.data.model, result.data.description)
            if (enhanced) {
              result.data = { ...result.data, ...enhanced }
              result.source = 'openfoodfacts_enhanced_ai'
            }
          } catch (error) {
            console.error("Error al mejorar información con IA:", error)
          }
        }
        
        return NextResponse.json(result)
      }
    } catch {
      console.log("OpenFoodFacts no encontró el producto, intentando Google Shopping...")
    }

    // Si las APIs anteriores no encontraron nada, intentar con Google Shopping
    // Usando Google Custom Search API si está configurada
    const googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
    const googleCx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

    if (googleApiKey && googleCx) {
      try {
        // Buscar en Google Shopping usando el código de barras
        // Intentar primero con búsqueda directa del código de barras
        const searchQuery = barcode
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(searchQuery)}&num=3`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        )

        if (response.ok) {
          const data = await response.json()

          // Verificar si hay errores en la respuesta
          if (data.error) {
            console.error('Error de Google Custom Search API:', data.error)
            // Continuar con otras fuentes si hay error de API
          } else if (data.items && data.items.length > 0) {
            // Buscar el mejor resultado (preferir resultados de Google Shopping)
            const shoppingItem = data.items.find((item: any) => 
              item.link?.includes('google.com/shopping') || 
              item.displayLink?.includes('google.com')
            ) || data.items[0]

            const item = shoppingItem
            const title = item.title || ''
            const snippet = item.snippet || ''
            
            // Intentar extraer información del título y snippet
            // El título generalmente contiene: "Nombre del Producto - Marca - Modelo"
            const titleParts = title.split(' - ')
            const productName = titleParts[0] || title
            const brand = titleParts[1] || null
            const model = titleParts[2] || null
            
            // Traducir descripción al español
            const translatedDescription = await translateToSpanish(snippet || productName)
            
            // Intentar obtener imagen del producto
            let imageUrl = null
            if (item.pagemap?.cse_image?.[0]?.src) {
              imageUrl = item.pagemap.cse_image[0].src
            } else if (item.pagemap?.metatags?.[0]?.['og:image']) {
              imageUrl = item.pagemap.metatags[0]['og:image']
            } else if (item.pagemap?.cse_thumbnail?.[0]?.src) {
              imageUrl = item.pagemap.cse_thumbnail[0].src
            }
            
            const result = {
              success: true,
              source: 'google_shopping',
              data: {
                name: shortenProductName(productName),
                brand: brand,
                model: model,
                description: translatedDescription || snippet || productName,
                imageUrl: imageUrl
              }
            }
            
            // Si falta información importante, intentar completarla con IA
            const needsEnhancement = !result.data.description || !result.data.imageUrl || (!result.data.brand && !result.data.model)
            if (needsEnhancement && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
              try {
                const enhanced = await enhanceProductInfoWithAI(result.data.name, result.data.brand, result.data.model, result.data.description)
                if (enhanced) {
                  result.data = { ...result.data, ...enhanced }
                  result.source = 'google_shopping_enhanced_ai'
                }
              } catch (error) {
                console.error("Error al mejorar información con IA:", error)
              }
            }
            
            return NextResponse.json(result)
          }
        } else {
          // Si la respuesta no es OK, loguear el error pero continuar
          const errorData = await response.json().catch(() => ({}))
          console.error('Error en respuesta de Google Custom Search:', response.status, errorData)
        }
      } catch (error) {
        console.error("Error al buscar en Google Custom Search:", error)
        // Continuar con otras fuentes si falla
      }
    } else {
      // Si no hay API key, intentar búsqueda directa en Google Shopping
      try {
        // Hacer una búsqueda web estructurada en Google Shopping
        const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(barcode)}`
        
        // Nota: Esta es una búsqueda web, no una API oficial
        // En producción, se recomienda usar Google Custom Search API
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        })

        if (response.ok) {
          const html = await response.text()
          
          // Intentar extraer información básica del HTML (parsing básico)
          // Esto es un fallback y puede no ser muy confiable
          const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i)
          const imageMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*producto[^"]*"/i)
          
          if (titleMatch) {
            const productName = titleMatch[1].trim()
            const translatedDescription = await translateToSpanish(productName)
            
            return NextResponse.json({
              success: true,
              source: 'google_shopping_web',
              data: {
                name: shortenProductName(productName),
                brand: null,
                model: null,
                description: translatedDescription || productName,
                imageUrl: imageMatch ? imageMatch[1] : null
              }
            })
          }
        }
      } catch {
        console.log("Búsqueda web en Google Shopping falló")
      }
    }

    // Si ninguna API encontró el producto, devolver mensaje estándar
    
    // Si ninguna API ni IA encontró el producto
    return NextResponse.json({
      success: false,
      message: 'No se encontró información del producto'
    })

  } catch (error) {
    console.error('Error al buscar información del producto:', error)
    return NextResponse.json(
      { error: 'Error al buscar información del producto' },
      { status: 500 }
    )
  }
}

