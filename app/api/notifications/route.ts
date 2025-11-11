import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { NotificationService } from '@/lib/services/notification-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

function decodeSasSession(raw?: string | null) {
  if (!raw) return null
  try {
    let parsed: any = null
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8')
      parsed = JSON.parse(decoded)
    } catch  {
      parsed = JSON.parse(raw)
    }
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

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

      const payload = await AdminJWTService.verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      filters.userId = payload.userId
    } else if (system === 'sas' && slug) {
      const session = decodeSasSession(cookieStore.get('sas-session')?.value)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (session.organizationSlug && session.organizationSlug !== slug) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      filters.usuarioSasId = session.userId || session.usuarioId
      filters.organizationId = session.organizationId

      if (!filters.usuarioSasId || !filters.organizationId) {
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
 * PATCH /api/notifications
 * Marcar notificación como leída (o todas si markAll=true)
 */
export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json()
    const id = body.id as string | undefined
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

        const payload = await AdminJWTService.verifyToken(token)
        if (!payload) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        filters.userId = payload.userId
      } else if (system === 'sas' && slug) {
        const session = decodeSasSession(cookieStore.get('sas-session')?.value)
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.organizationSlug && session.organizationSlug !== slug) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        filters.usuarioSasId = session.userId || session.usuarioId
        filters.organizationId = session.organizationId

        if (!filters.usuarioSasId || !filters.organizationId) {
          return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }
      }

      const result = await NotificationService.markAllAsRead(filters)
      return NextResponse.json({ success: true, count: result.count })
    } else if (id) {
      await NotificationService.markAsRead(id)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'id is required when markAll is false' }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'MARK_NOTIFICATION_READ' }))
  }
}

