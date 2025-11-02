import { NextResponse } from 'next/server'

/**
 * Liveness Probe
 * 
 * Endpoint ultra-ligero para verificar que el proceso está vivo.
 * No hace checks pesados, solo verifica que el servidor responde.
 * 
 * Usado por:
 * - Kubernetes liveness probes
 * - Monitoreo básico de uptime
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  )
}

