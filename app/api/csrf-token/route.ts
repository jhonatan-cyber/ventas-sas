/**
 * Endpoint para obtener token CSRF
 * 
 * GET /api/csrf-token
 * Devuelve el token CSRF que debe enviarse en el header X-CSRF-Token
 */

import { NextRequest, NextResponse } from 'next/server'

import { getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/utils/csrf-protection'

export async function GET(request: NextRequest) {
  const token = getOrGenerateCSRFToken(request)
  
  const response = NextResponse.json({
    token,
    headerName: 'x-csrf-token',
  })

  // Establecer cookie con el token
  setCSRFTokenCookie(response, token)

  return response
}

