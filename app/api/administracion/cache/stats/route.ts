import { NextRequest, NextResponse } from 'next/server'

import { CacheService } from '@/lib/services/admin/cache-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * GET /api/administracion/cache/stats
 * Obtener estadísticas del caché
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const stats = CacheService.getStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
