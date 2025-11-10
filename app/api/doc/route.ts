/**
 * OpenAPI/Swagger JSON Endpoint
 * 
 * GET /api/doc
 * Devuelve la especificación OpenAPI 3.0 en formato JSON
 */

import { NextResponse } from 'next/server'

import { swaggerSpec } from '@/lib/swagger/swagger-spec'

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

