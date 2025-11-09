import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/ai/gemini-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// POST - Generar o mejorar descripción de producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const { name, brand, model, existingDescription, category } = body

    // Validar que al menos el nombre esté presente
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw AppError.badRequest('El nombre del producto es requerido')
    }

    // Verificar que la API key esté configurada
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'La API key de Google Generative AI no está configurada. Agrega GOOGLE_GENERATIVE_AI_API_KEY a tu archivo .env',
        },
        { status: 500 }
      )
    }

    // Generar la descripción y buscar información del producto (imagen, marca, modelo) en paralelo
    const [description, productInfo] = await Promise.all([
      GeminiService.generateProductDescription({
        name: name.trim(),
        brand: brand?.trim() || null,
        model: model?.trim() || null,
        existingDescription: existingDescription?.trim() || null,
        category: category?.trim() || null,
      }),
      GeminiService.searchProductInfo(
        name.trim(),
        brand?.trim() || null,
        model?.trim() || null
      ),
    ])

    return NextResponse.json({
      success: true,
      description,
      imageUrl: productInfo.imageUrl || null,
      brand: productInfo.brand || null,
      model: productInfo.model || null,
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

