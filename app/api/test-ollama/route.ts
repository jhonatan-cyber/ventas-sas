import { NextRequest, NextResponse } from 'next/server'

import { listAvailableModels } from '@/lib/services/ai/product-ai-service'

export async function GET(_request: NextRequest) {
  try {
    const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    // Verificar que Ollama esté ejecutándose
    try {
      const healthCheck = await fetch(`${ollamaBase}/api/tags`, {
        method: 'GET',
      })

      if (!healthCheck.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ollama no está respondiendo',
            details: `No se pudo conectar a Ollama en ${ollamaBase}. Verifica que Ollama esté ejecutándose.`,
          },
          { status: 500 }
        )
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al conectar con Ollama',
          details: `No se pudo conectar a Ollama en ${ollamaBase}. Error: ${error.message}`,
        },
        { status: 500 }
      )
    }

    // Listar modelos disponibles
    const models = await listAvailableModels()

    if (models.available.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay modelos disponibles',
          details: 'Ollama está ejecutándose pero no hay modelos instalados. Instala un modelo con: ollama pull gpt-oss:20b',
          ollamaBase,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ollama está funcionando correctamente',
      ollamaBase,
      models: models.available,
      details: models.details,
    })
  } catch (error: any) {
    console.error('Error en test de Ollama:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al probar Ollama',
        details: error.message || 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
