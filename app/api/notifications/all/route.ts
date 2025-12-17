import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { NotificationService } from '@/lib/services/notification-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

/**
 * PATCH /api/notifications/all
 * Marcar todas las notificaciones como leídas
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const system = searchParams.get("System")
    const slug = searchParams.get("Slug")

    const cookieStore = await cookies()
    const filters: any = {}

    if (system === 'admin') {
      const token = cookieStore.get("admin-auth-token")?.value
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const payload = await AdminJWTService.verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      filters.userId = payload.userId
    } else if (system === 'sas' && slug) {
      const sessionCookie = cookieStore.get("sas-session")?.value
      if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      try {
        const session = JSON.parse(sessionCookie)
        filters.usuarioSasId = session.usuarioId
        filters.organizationId = session.organizationId
        filters.customerId = session.customerId
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const result = await NotificationService.markAllAsRead(filters)
    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'MARK_ALL_READ' }))
  }
}

