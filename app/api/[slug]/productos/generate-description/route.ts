import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { buildInventoryDescriptionPrompt } from '@/lib/services/ai/prompts'
import { chatCompleteWithOptions, type AIProvider } from '@/lib/services/ai/provider'

// POST - Generar o mejorar descripción de producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: _slug } = await params
    const body = await request.json() as {
      name: string
      brand?: string | null
      model?: string | null
      existingDescription?: string | null
      category?: string | null
      provider?: AIProvider
      modelOverride?: string
      temperature?: number
    }

    const { name, brand, model, existingDescription, category, provider, modelOverride, temperature } = body

    // Validar que al menos el nombre esté presente
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw AppError.validation('El nombre del producto es requerido')
    }

    // Construir prompt de inventario (técnico, 30–50 palabras)
    const basePrompt = buildInventoryDescriptionPrompt({
      name: name.trim(),
      brand: brand?.trim() || null,
      category: category?.trim() || null,
      existingDescription: existingDescription?.trim() || null,
      model: model?.trim() || null,
    })

    let description = await chatCompleteWithOptions(
      [{ role: 'user', content: basePrompt }],
      { preferredProvider: provider, model: modelOverride, temperature: temperature ?? 0.4 }
    )

    // Post-procesar para asegurar brevedad (máx ~60 palabras / 420 chars)
    try {
      const words = description.split(/\s+/)
      if (words.length > 60) {
        description = words.slice(0, 60).join(' ').replace(/[.,;:\-–—]*$/, '') + '…'
      }
      if (description.length > 420) {
        const short = description.slice(0, 420)
        const cut = short.lastIndexOf(' ')
        description = (cut > 0 ? short.slice(0, cut) : short).replace(/[.,;:\-–—]*$/, '') + '…'
      }
    } catch {}

    // Función helper para extraer marca y modelo del nombre del producto (fallback cuando Gemini no está disponible)
    const extractBrandAndModelFromName = (productName: string): { brand: string | null; model: string | null } => {
      const name = productName.trim()
      
      // Patrones comunes de marcas conocidas
      const brandPatterns = [
        { pattern: /^iphone\s+/i, brand: 'Apple', modelExtractor: (n: string) => n.replace(/^iphone\s+/i, '').trim() },
        { pattern: /^samsung\s+/i, brand: 'Samsung', modelExtractor: (n: string) => n.replace(/^samsung\s+/i, '').trim() },
        { pattern: /^xiaomi\s+/i, brand: 'Xiaomi', modelExtractor: (n: string) => n.replace(/^xiaomi\s+/i, '').trim() },
        { pattern: /^huawei\s+/i, brand: 'Huawei', modelExtractor: (n: string) => n.replace(/^huawei\s+/i, '').trim() },
        { pattern: /^motorola\s+/i, brand: 'Motorola', modelExtractor: (n: string) => n.replace(/^motorola\s+/i, '').trim() },
        { pattern: /^lg\s+/i, brand: 'LG', modelExtractor: (n: string) => n.replace(/^lg\s+/i, '').trim() },
        { pattern: /^sony\s+/i, brand: 'Sony', modelExtractor: (n: string) => n.replace(/^sony\s+/i, '').trim() },
        { pattern: /^lenovo\s+/i, brand: 'Lenovo', modelExtractor: (n: string) => n.replace(/^lenovo\s+/i, '').trim() },
        { pattern: /^hp\s+/i, brand: 'HP', modelExtractor: (n: string) => n.replace(/^hp\s+/i, '').trim() },
        { pattern: /^dell\s+/i, brand: 'Dell', modelExtractor: (n: string) => n.replace(/^dell\s+/i, '').trim() },
        { pattern: /^asus\s+/i, brand: 'ASUS', modelExtractor: (n: string) => n.replace(/^asus\s+/i, '').trim() },
        { pattern: /^acer\s+/i, brand: 'Acer', modelExtractor: (n: string) => n.replace(/^acer\s+/i, '').trim() },
        { pattern: /^nokia\s+/i, brand: 'Nokia', modelExtractor: (n: string) => n.replace(/^nokia\s+/i, '').trim() },
        { pattern: /^oppo\s+/i, brand: 'OPPO', modelExtractor: (n: string) => n.replace(/^oppo\s+/i, '').trim() },
        { pattern: /^vivo\s+/i, brand: 'Vivo', modelExtractor: (n: string) => n.replace(/^vivo\s+/i, '').trim() },
        { pattern: /^realme\s+/i, brand: 'Realme', modelExtractor: (n: string) => n.replace(/^realme\s+/i, '').trim() },
        { pattern: /^oneplus\s+/i, brand: 'OnePlus', modelExtractor: (n: string) => n.replace(/^oneplus\s+/i, '').trim() },
      ]
      
      // Intentar encontrar una marca conocida
      for (const { pattern, brand, modelExtractor } of brandPatterns) {
        if (pattern.test(name)) {
          const model = modelExtractor(name)
          return { brand, model: model || null }
        }
      }
      
      // Si no se encuentra una marca conocida, intentar extraer la primera palabra como marca
      const words = name.split(/\s+/)
      if (words.length >= 2) {
        const firstWord = words[0]
        // Si la primera palabra parece una marca (mayúsculas o nombre propio)
        if (firstWord.length > 2 && (firstWord[0] === firstWord[0].toUpperCase() || /^[A-Z]/.test(firstWord))) {
          return {
            brand: firstWord,
            model: words.slice(1).join(' ').trim() || null
          }
        }
      }
      
      return { brand: null, model: null }
    }
    
    // Función para extraer marca y modelo usando Groq/DeepSeek
    const extractBrandAndModelWithAI = async (productName: string): Promise<{ brand: string | null; model: string | null }> => {
      try {
        const prompt = `Analiza el siguiente nombre de producto y extrae SOLO la marca y el modelo.

Nombre del producto: ${productName}

Responde en formato JSON con esta estructura exacta:
{
  "brand": "nombre de la marca o null",
  "model": "nombre del modelo o null"
}

Ejemplos:
- "iPhone 14 Pro Max" → {"brand": "Apple", "model": "14 Pro Max"}
- "Samsung Galaxy S23 Ultra" → {"brand": "Samsung", "model": "Galaxy S23 Ultra"}
- "Laptop HP Pavilion 15" → {"brand": "HP", "model": "Pavilion 15"}
- "Mouse Logitech MX Master 3" → {"brand": "Logitech", "model": "MX Master 3"}

Responde SOLO con el JSON, sin texto adicional:`

        const text = await chatCompleteWithOptions(
          [{ role: 'user', content: prompt }],
          { temperature: 0.3 }
        )

        // Intentar parsear el JSON de la respuesta
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return {
              brand: parsed.brand && parsed.brand !== "null" ? parsed.brand.trim() : null,
              model: parsed.model && parsed.model !== "null" ? parsed.model.trim() : null,
            }
          }
        } catch (parseError) {
          console.log("Error al parsear respuesta de IA:", parseError)
        }

        return { brand: null, model: null }
      } catch (error) {
        console.error("Error al extraer marca y modelo con IA:", error)
        return { brand: null, model: null }
      }
    }
    
    // Buscar imagen con Google Custom Search (si está configurado)
    // Siempre intentar extraer marca y modelo del nombre, incluso si ya se proporcionaron
    let extracted = { brand: null as string | null, model: null as string | null }
    
    // Primero intentar con IA (Groq/DeepSeek)
    try {
      extracted = await extractBrandAndModelWithAI(name.trim())
    } catch (error) {
      // Si la IA falla, usar fallback básico
      console.log('IA no disponible, usando extracción básica:', error)
      extracted = extractBrandAndModelFromName(name.trim())
    }
    
    // Si aún no se encontró nada, usar el fallback básico
    if (!extracted.brand && !extracted.model) {
      extracted = extractBrandAndModelFromName(name.trim())
    }
    
    console.log('Marca y modelo extraídos:', { extracted, providedBrand: brand, providedModel: model })
    
    // Usar los valores extraídos si están disponibles, o los proporcionados como fallback
    const finalBrand = extracted.brand || brand?.trim() || null
    const finalModel = extracted.model || model?.trim() || null
    
    // Buscar imagen del producto usando Google Custom Search (si está configurado)
    let imageUrl = null
    try {
      const geminiService = (await import('@/lib/services/ai/gemini-service')).GeminiService
      const productInfo = await geminiService.searchProductInfo(
        name.trim(),
        finalBrand,
        finalModel
      )
      imageUrl = productInfo.imageUrl || null
    } catch (error) {
      console.log('Búsqueda de imagen no disponible:', error)
    }

    console.log('Información del producto encontrada:', { imageUrl, finalBrand, finalModel })

    // Priorizar valores extraídos, asegurando que siempre se devuelvan si existen
    const responseBrand = finalBrand
    const responseModel = finalModel

    console.log('Valores finales a devolver:', { responseBrand, responseModel })

    return NextResponse.json({
      success: true,
      description,
      imageUrl: imageUrl,
      brand: responseBrand,
      model: responseModel,
    })
  } catch (error: any) {
    // Manejar errores específicos de Gemini
    const errorMessage = error?.message || 'Error desconocido al generar la descripción'
    
    console.error('Error en generate-description:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

