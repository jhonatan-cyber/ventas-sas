import { NextRequest, NextResponse } from 'next/server'

import { PermissionAdminService } from '@/lib/services/admin/permission-admin-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

// GET - Obtener estadísticas de permisos
export async function GET(request: NextRequest) {
  try {
    const stats = await PermissionAdminService.getPermissionStats()
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PERMISSION_STATS_ADMIN' }))
  }
}

