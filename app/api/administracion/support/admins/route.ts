import { NextRequest, NextResponse } from 'next/server'

import { SupportService } from '@/lib/services/admin/support-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * GET /api/administracion/support/admins
 * Obtener administradores disponibles para asignar tickets
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const admins = await SupportService.getAvailableAdmins()

    return NextResponse.json(admins)
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
