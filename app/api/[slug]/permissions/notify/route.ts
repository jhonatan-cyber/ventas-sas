import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { notifyPermissionChange } from "../events/route"

import { getOrganizationIdByCustomerSlug } from "@/lib/utils/organization"

// Importar la función de notificación del archivo SSE

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Verificar sesión
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("sas-session")
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
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
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    // Verificar que la sesión corresponde a la organización correcta
    if (session.organizationSlug !== slug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 })
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json()
    const { type, roleId, roleName, userId, message } = body

    // Validar datos requeridos
    if (!type || !message) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Enviar notificación a través de SSE
    notifyPermissionChange(organizationId, {
      type,
      roleId,
      roleName,
      userId,
      message
    })

    return NextResponse.json({ success: true, message: "Notificación enviada" })

  } catch (error) {
    console.error("Error en notificación de permisos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}