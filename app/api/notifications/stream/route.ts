import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { NotificationService } from '@/lib/services/notification-service'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { SasJWTService } from '@/lib/auth/sas-jwt'
import { logger } from '@/lib/utils/logger'

/**
 * Server-Sent Events (SSE) endpoint para notificaciones en tiempo real
 * 
 * Uso:
 * - Admin: GET /api/notifications/stream?system=admin
 * - SAS: GET /api/notifications/stream?system=sas&slug=customer-slug
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const system = searchParams.get('system') // 'admin' | 'sas'
  const slug = searchParams.get('slug') // Para SAS

  try {
    // Verificar autenticación
    const cookieStore = await cookies()
    let userId: string | undefined
    let usuarioSasId: string | undefined
    let organizationId: string | undefined
    let customerId: string | undefined

    if (system === 'admin') {
      const token = cookieStore.get('admin-auth-token')?.value
      if (!token) {
        return new Response('Unauthorized', { status: 401 })
      }

      const payload = AdminJWTService.verifyToken(token)
      if (!payload) {
        return new Response('Unauthorized', { status: 401 })
      }

      userId = payload.userId
    } else if (system === 'sas' && slug) {
      const token = cookieStore.get('sas-auth-token')?.value
      const sessionCookie = cookieStore.get('sas-session')?.value

      if (!token && !sessionCookie) {
        return new Response('Unauthorized', { status: 401 })
      }

      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie)
          usuarioSasId = session.usuarioId
          organizationId = session.organizationId
          customerId = session.customerId
        } catch {
          return new Response('Invalid session', { status: 401 })
        }
      } else if (token) {
        const payload = await SasJWTService.verifyToken(token)
        if (!payload) {
          return new Response('Unauthorized', { status: 401 })
        }
        usuarioSasId = payload.usuarioId
        organizationId = payload.organizationId
        customerId = payload.customerId
      }
    } else {
      return new Response('Invalid parameters', { status: 400 })
    }

    // Crear stream SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Función para enviar mensaje SSE
        const send = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        // Enviar evento de conexión
        send({ type: 'connected', timestamp: new Date().toISOString() })

        // Enviar notificaciones iniciales no leídas
        try {
          const filters: any = {}
          if (userId) filters.userId = userId
          if (usuarioSasId) filters.usuarioSasId = usuarioSasId
          if (organizationId) filters.organizationId = organizationId
          if (customerId) filters.customerId = customerId

          const { notifications } = await NotificationService.getUnreadNotifications(filters)
          
          if (notifications.length > 0) {
            send({
              type: 'notifications',
              data: notifications,
            })
          }
        } catch (error) {
          logger.error('Error fetching initial notifications', error as Error)
        }

        // Polling para nuevas notificaciones cada 5 segundos
        const pollInterval = setInterval(async () => {
          try {
            const filters: any = { isRead: false }
            if (userId) filters.userId = userId
            if (usuarioSasId) filters.usuarioSasId = usuarioSasId
            if (organizationId) filters.organizationId = organizationId
            if (customerId) filters.customerId = customerId

            const { notifications } = await NotificationService.getUnreadNotifications(filters)
            
            if (notifications.length > 0) {
              send({
                type: 'new_notification',
                data: notifications,
              })
            }

            // Enviar heartbeat cada 30 segundos
            send({ type: 'heartbeat', timestamp: new Date().toISOString() })
          } catch (error) {
            logger.error('Error polling notifications', error as Error)
          }
        }, 5000) // Poll cada 5 segundos

        // Cleanup cuando el cliente se desconecta
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Deshabilitar buffering de nginx
      },
    })
  } catch (error) {
    logger.error('Error in notification stream', error as Error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

