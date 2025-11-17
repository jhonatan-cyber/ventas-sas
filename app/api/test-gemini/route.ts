import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

// GET - Endpoint de prueba para verificar la API key de Gemini
export async function GET(_request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key no configurada',
          details: 'La variable GOOGLE_GENERATIVE_AI_API_KEY no está en el archivo .env',
        },
        { status: 500 }
      )
    }

    // Importar la función para listar modelos disponibles
    const { listAvailableModels } = await import('@/lib/services/ai/gemini-service')
    
    // Listar modelos disponibles
    const modelsInfo = await listAvailableModels()
    
    if (modelsInfo.working.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Ningún modelo disponible',
        details: 'No se encontraron modelos disponibles en tu cuenta. Verifica en Google AI Studio (https://aistudio.google.com/) que los modelos estén habilitados.',
        tested: modelsInfo.tested,
        testedDetails: modelsInfo.details,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        sdk: '@google/genai',
        apiVersion: 'v1beta',
        recommendation: 'Verifica en Google AI Studio qué modelos están habilitados en tu cuenta. Puede ser necesario habilitar los modelos manualmente.',
        howToCheck: '1. Ve a https://aistudio.google.com/ 2. Inicia sesión con tu cuenta de Google 3. Ve a la sección de modelos o configuración 4. Verifica qué modelos están habilitados',
      }, { status: 200 }) // Cambiar a 200 para que se muestre la información
    }

    return NextResponse.json({
      success: true,
      message: 'API key válida y funcionando',
      workingModels: modelsInfo.working,
      availableModels: modelsInfo.available,
      testedModels: modelsInfo.tested,
      testedDetails: modelsInfo.details,
      recommendedModel: modelsInfo.working[0],
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      note: `Modelos disponibles: ${modelsInfo.working.join(', ')}. Se recomienda usar "${modelsInfo.working[0]}".`,
      sdk: '@google/genai',
      apiVersion: 'v1beta',
    })
  } catch (error: any) {
    console.error('Error al probar Gemini API:', error)
    
    let errorMessage = 'Error desconocido'
    let errorDetails = error?.message || 'Sin detalles'

    if (error?.message?.includes('API_KEY')) {
      errorMessage = 'API key inválida'
      errorDetails = 'La API key proporcionada no es válida o ha sido revocada'
    } else if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      errorMessage = 'Cuota excedida'
      errorDetails = 'Se ha excedido la cuota de la API. Verifica tu plan en Google AI Studio'
    } else if (error?.message?.includes('model')) {
      errorMessage = 'Modelo no disponible'
      errorDetails = 'El modelo solicitado no está disponible en tu cuenta'
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        fullError: error?.message,
      },
      { status: 500 }
    )
  }
}

