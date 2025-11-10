import { NextRequest, NextResponse } from 'next/server'

import { SupportService } from '@/lib/services/admin/support-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * GET /api/administracion/support/stats
 * Obtener estadísticas de tickets
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || undefined

    const stats = await SupportService.getTicketStats(organizationId)

    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
