import { NextRequest, NextResponse } from 'next/server'

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
        
        return NextResponse.json({
          success: true,
          source: 'upcitemdb',
          data: {
            name: item.title,
            brand: item.brand,
            model: item.model,
            description: translatedDescription || description,
            imageUrl: item.images && item.images.length > 0 ? item.images[0] : null
          }
        })
      }
    } catch (error) {
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
        
        return NextResponse.json({
          success: true,
          source: 'openfoodfacts',
          data: {
            name: product.product_name,
            brand: product.brands ? product.brands.split(",")[0].trim() : null,
            model: null,
            description: translatedDescription || description,
            imageUrl: product.image_url || null
          }
        })
      }
    } catch (error) {
      console.log("OpenFoodFacts no encontró el producto")
    }

    // Si ninguna API encontró el producto
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

