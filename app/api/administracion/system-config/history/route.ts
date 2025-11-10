/**
 * GET /api/administracion/system-config/history
 * 
 * Obtiene el historial de cambios en configuraciones
 */

import { NextRequest, NextResponse } from 'next/server'

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!key) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro key' },
        { status: 400 }
      )
    }

    const history = await SystemConfigService.getConfigHistory(key, limit)
    
    return NextResponse.json({
      success: true,
      history
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
