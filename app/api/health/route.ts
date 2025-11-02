import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message: string
  timestamp: string
  responseTime?: number
  details?: Record<string, any>
}

/**
 * Health Check Endpoint
 * 
 * Este endpoint permite a servicios de monitoreo verificar el estado del sistema.
 * Útil para:
 * - Uptime monitoring (Uptime Robot, Pingdom, etc.)
 * - Load balancer health checks
 * - Kubernetes liveness/readiness probes
 * 
 * GET /api/health - Health check básico
 */
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, HealthCheck> = {}

  // Check 1: Base de datos
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime

    checks.database = {
      status: 'healthy',
      message: 'Base de datos conectada',
      timestamp: new Date().toISOString(),
      responseTime: dbResponseTime,
      details: {
        connectionPool: 'active',
      },
    }
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      message: `Error de conexión: ${error.message}`,
      timestamp: new Date().toISOString(),
      details: {
        error: error.message,
      },
    }
  }

  // Check 2: Memoria del proceso
  try {
    const memUsage = process.memoryUsage()
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    }

    // Considerar unhealthy si el uso de memoria es muy alto (>2GB)
    const isHighMemory = memUsageMB.heapUsed > 2048

    checks.memory = {
      status: isHighMemory ? 'degraded' : 'healthy',
      message: isHighMemory
        ? 'Uso de memoria elevado'
        : 'Memoria dentro de límites normales',
      timestamp: new Date().toISOString(),
      details: {
        usage: memUsageMB,
        limit: 2048, // MB
      },
    }
  } catch (error: any) {
    checks.memory = {
      status: 'unhealthy',
      message: `Error al verificar memoria: ${error.message}`,
      timestamp: new Date().toISOString(),
    }
  }

  // Check 3: Uptime del proceso
  const uptimeSeconds = process.uptime()
  const uptimeHours = Math.floor(uptimeSeconds / 3600)
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60)

  checks.uptime = {
    status: 'healthy',
    message: `Sistema activo desde hace ${uptimeHours}h ${uptimeMinutes}m`,
    timestamp: new Date().toISOString(),
    details: {
      seconds: Math.floor(uptimeSeconds),
      formatted: `${uptimeHours}h ${uptimeMinutes}m`,
    },
  }

  // Check 4: Variables de entorno críticas
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SAS_JWT_SECRET',
    'ADMIN_JWT_SECRET',
  ]

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  )

  checks.environment = {
    status: missingEnvVars.length > 0 ? 'unhealthy' : 'healthy',
    message:
      missingEnvVars.length > 0
        ? `Variables de entorno faltantes: ${missingEnvVars.join(', ')}`
        : 'Todas las variables de entorno requeridas están configuradas',
    timestamp: new Date().toISOString(),
    details: {
      missing: missingEnvVars,
      checked: requiredEnvVars.length,
      present: requiredEnvVars.length - missingEnvVars.length,
    },
  }

  // Calcular estado general
  const totalResponseTime = Date.now() - startTime
  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy')
  const hasUnhealthy = Object.values(checks).some(
    (c) => c.status === 'unhealthy'
  )

  const overallStatus = hasUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded'

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: totalResponseTime,
    checks,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }

  // Retornar código de estado apropiado
  const statusCode = hasUnhealthy ? 503 : allHealthy ? 200 : 200 // 200 incluso para degraded

  return NextResponse.json(response, { status: statusCode })
}

