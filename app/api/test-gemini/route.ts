import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// GET - Endpoint de prueba para verificar la API key de Gemini
export async function GET(request: NextRequest) {
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

    // Intentar inicializar el cliente con el nuevo SDK
    const client = new GoogleGenAI({ apiKey })
    
    // Intentar con diferentes modelos disponibles (según documentación oficial)
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    let workingModelName = ''
    let lastError = null
    
    for (const modelNameToTry of modelsToTry) {
      try {
        // Usar el nuevo formato de la API según documentación oficial
        const response = await client.models.generateContent({
          model: modelNameToTry,
          contents: 'Responde solo con "OK"',
        })
        
        if (response.text) {
          workingModelName = modelNameToTry
          break
        }
      } catch (error: any) {
        lastError = error
        console.log(`Modelo ${modelNameToTry} no disponible:`, error.message)
        continue
      }
    }
    
    if (!workingModelName) {
      throw new Error(`Ninguno de los modelos está disponible. Último error: ${lastError?.message || 'Desconocido'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'API key válida y funcionando',
      modelUsed: workingModelName,
      availableModels: modelsToTry,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      note: `Usa el modelo "${workingModelName}" en tu configuración`,
      sdk: '@google/genai (nuevo SDK oficial)',
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

