import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { NotificationService } from '@/lib/services/notification-service'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { SasJWTService } from '@/lib/auth/sas-jwt'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const system = searchParams.get('system') // 'admin' | 'sas'
    const slug = searchParams.get('slug') // Para SAS
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const isRead = searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined

    const cookieStore = await cookies()
    const filters: any = {
      isRead,
    }

    if (system === 'admin') {
      const token = cookieStore.get('admin-auth-token')?.value
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const payload = AdminJWTService.verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      filters.userId = payload.userId
    } else if (system === 'sas' && slug) {
      const sessionCookie = cookieStore.get('sas-session')?.value
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

    const skip = (page - 1) * pageSize
    const { notifications, total } = await NotificationService.getNotifications(
      filters,
      skip,
      pageSize
    )

    return NextResponse.json({
      notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_NOTIFICATIONS' }))
  }
}

/**
 * PATCH /api/notifications/[id]
 * Marcar notificación como leída
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const markAll = body.markAll === true

    if (markAll) {
      const { searchParams } = new URL(request.url)
      const system = searchParams.get('system')
      const slug = searchParams.get('slug')

      const cookieStore = await cookies()
      const filters: any = {}

      if (system === 'admin') {
        const token = cookieStore.get('admin-auth-token')?.value
        if (!token) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = AdminJWTService.verifyToken(token)
        if (!payload) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        filters.userId = payload.userId
      } else if (system === 'sas' && slug) {
        const sessionCookie = cookieStore.get('sas-session')?.value
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
      }

      const result = await NotificationService.markAllAsRead(filters)
      return NextResponse.json({ success: true, count: result.count })
    } else {
      await NotificationService.markAsRead(id)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'MARK_NOTIFICATION_READ' }))
  }
}

