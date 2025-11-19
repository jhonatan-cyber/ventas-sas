/**
 * API endpoint para traducción automática
 * Traduce texto usando Google Translate API
 */

import { NextRequest, NextResponse } from 'next/server'

import { translateText, translateObject } from '@/lib/services/translation/auto-translate-service'

export const runtime = 'nodejs'

// POST - Traducir texto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, sourceLanguage = 'es', targetLanguage, object } = body

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'targetLanguage es requerido' },
        { status: 400 }
      )
    }

    if (object) {
      // Traducir objeto completo
      const translated = await translateObject(object, sourceLanguage, targetLanguage)
      return NextResponse.json({ success: true, translated })
    }

    if (!text) {
      return NextResponse.json(
        { error: 'text o object es requerido' },
        { status: 400 }
      )
    }

    // Traducir texto simple
    const translated = await translateText(text, {
      sourceLanguage,
      targetLanguage
    })

    return NextResponse.json({ success: true, translated })
  } catch (error) {
    console.error('Error en API de traducción:', error)
    return NextResponse.json(
      { error: 'Error al traducir', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}


