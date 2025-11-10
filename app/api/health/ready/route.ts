import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

/**
 * Readiness Probe
 * 
 * Endpoint más simple y rápido para verificar si la aplicación está lista
 * para recibir tráfico. Usado típicamente por:
 * - Kubernetes readiness probes
 * - Load balancers
 * 
 * Solo verifica conexión a la base de datos (crítico para funcionamiento)
 */
export async function GET() {
  try {
    // Verificación rápida de base de datos
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'not_ready',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

