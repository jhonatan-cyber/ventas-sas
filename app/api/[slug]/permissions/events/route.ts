import { cookies } from "next/headers"
import { NextRequest } from "next/server"

import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

// Mapa para mantener las conexiones SSE activas por organización
const connections = new Map<string, Set<ReadableStreamDefaultController>>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar sesión
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("sas-session")

    if (!sessionCookie) {
      return new Response("No autorizado", { status: 401 })
    }

    let session: any = null
    try {
      const value = sessionCookie.value
      let decoded: string
      try {
        decoded = Buffer.from(value, 'base64').toString('utf8')
        session = JSON.parse(decoded)
      } catch {
        session = JSON.parse(value)
      }
    } catch {
      return new Response("Sesión inválida", { status: 401 })
    }

    // Verificar que la sesión corresponde a la organización correcta
    if (session.organizationSlug !== slug) {
      return new Response("No autorizado", { status: 401 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return new Response("Organización no encontrada", { status: 404 })
    }

    // Crear stream SSE
    let streamController: ReadableStreamDefaultController<any> | null = null

    const stream = new ReadableStream({
      start(controller) {
        streamController = controller

        // Agregar esta conexión al mapa
        if (!connections.has(organizationId)) {
          connections.set(organizationId, new Set())
        }
        connections.get(organizationId)!.add(controller)

        // Enviar evento inicial
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Conectado a eventos de permisos',
          timestamp: new Date().toISOString()
        })}\n\n`)

        // Mantener la conexión viva con ping cada 30 segundos
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })}\n\n`)
          } catch {
            // Conexión cerrada, limpiar
            clearInterval(pingInterval)
            connections.get(organizationId)?.delete(controller)
          }
        }, 30000)

        // Limpiar cuando se cierre la conexión
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval)
          connections.get(organizationId)?.delete(controller)
          if (connections.get(organizationId)?.size === 0) {
            connections.delete(organizationId)
          }
        })
      },
      cancel() {
        // Limpiar conexión
        if (streamController) {
          connections.get(organizationId)?.delete(streamController)
          if (connections.get(organizationId)?.size === 0) {
            connections.delete(organizationId)
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error("Error en SSE de permisos:", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}

// Función para notificar cambios de permisos a todas las conexiones de una organización
export function notifyPermissionChange(organizationId: string, data: {
  type: 'role_updated' | 'permissions_changed'
  roleId?: string
  roleName?: string
  userId?: string
  message: string
}) {
  const orgConnections = connections.get(organizationId)
  if (!orgConnections || orgConnections.size === 0) {
    return
  }

  const eventData = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  })

  // Enviar a todas las conexiones activas
  const deadConnections: ReadableStreamDefaultController[] = []

  orgConnections.forEach(controller => {
    try {
      controller.enqueue(`data: ${eventData}\n\n`)
    } catch {
      // Conexión muerta, marcar para eliminación
      deadConnections.push(controller)
    }
  })

  // Limpiar conexiones muertas
  deadConnections.forEach(controller => {
    orgConnections.delete(controller)
  })

  if (orgConnections.size === 0) {
    connections.delete(organizationId)
  }
}