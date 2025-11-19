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

    // Buscar imagen/brand/model con Google Custom Search (si está configurado)
    const productInfo = await (await import('@/lib/services/ai/gemini-service')).GeminiService.searchProductInfo(
      name.trim(),
      brand?.trim() || null,
      model?.trim() || null
    )

    return NextResponse.json({
      success: true,
      description,
      imageUrl: productInfo.imageUrl || null,
      brand: productInfo.brand || brand || null,
      model: productInfo.model || model || null,
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

