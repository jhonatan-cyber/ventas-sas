import { NextRequest, NextResponse } from 'next/server'
import { NotificationService, NotificationType } from '@/lib/services/notification-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { z } from 'zod'

const sendBulkNotificationSchema = z.object({
  targetType: z.enum(['all_admins', 'organization', 'organizations', 'users']),
  organizationId: z.string().optional(),
  organizationIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  usuarioSasIds: z.array(z.string()).optional(),
  type: z.enum([
    'stock_low',
    'new_sale',
    'new_quotation',
    'quotation_expired',
    'system',
    'expense_created',
    'cash_register_opened',
    'cash_register_closed',
    'user_created',
    'product_created',
  ]) as z.ZodType<NotificationType>,
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es demasiado largo'),
  message: z.string().min(1, 'El mensaje es requerido').max(1000, 'El mensaje es demasiado largo'),
  data: z.record(z.any()).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

/**
 * POST /api/administracion/notifications/bulk
 * Enviar notificación masiva
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos
    const validation = sendBulkNotificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Calcular fecha de expiración
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    let result

    // Enviar según el tipo de destino
    switch (data.targetType) {
      case 'all_admins':
        result = await NotificationService.sendBulkToAllAdmins(
          data.type,
          data.title,
          data.message,
          data.data,
          expiresAt
        )
        break

      case 'organization':
        if (!data.organizationId) {
          return NextResponse.json(
            { error: 'organizationId es requerido para targetType "organization"' },
            { status: 400 }
          )
        }
        result = await NotificationService.sendBulkToOrganization(
          data.organizationId,
          data.type,
          data.title,
          data.message,
          data.data,
          expiresAt
        )
        break

      case 'organizations':
        if (!data.organizationIds || data.organizationIds.length === 0) {
          return NextResponse.json(
            { error: 'organizationIds es requerido para targetType "organizations"' },
            { status: 400 }
          )
        }
        result = await NotificationService.sendBulkToOrganizations(
          data.organizationIds,
          data.type,
          data.title,
          data.message,
          data.data,
          expiresAt
        )
        break

      case 'users':
        if (
          (!data.userIds || data.userIds.length === 0) &&
          (!data.usuarioSasIds || data.usuarioSasIds.length === 0)
        ) {
          return NextResponse.json(
            { error: 'Debe especificar al menos userIds o usuarioSasIds' },
            { status: 400 }
          )
        }
        result = await NotificationService.sendBulkToUsers(
          data.userIds || [],
          data.usuarioSasIds || [],
          data.type,
          data.title,
          data.message,
          data.data,
          expiresAt
        )
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de destino no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Notificación enviada exitosamente a ${result.count} destinatarios`,
      count: result.count,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
