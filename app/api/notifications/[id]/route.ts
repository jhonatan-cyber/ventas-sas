import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { NotificationService } from '@/lib/services/notification-service'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

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
    await NotificationService.markAsRead(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'MARK_NOTIFICATION_READ' }))
  }
}

/**
 * DELETE /api/notifications/[id]
 * Eliminar notificación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await NotificationService.deleteNotification(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_NOTIFICATION' }))
  }
}

