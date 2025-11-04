import { NextRequest, NextResponse } from "next/server"
import { CustomerOrganizationService } from "@/lib/services/admin/customer-organization-service"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AuthService } from "@/lib/services/auth-service"
import { cookies } from "next/headers"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string; organizationId: string } }
) {
  try {
    // Autenticación
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Token inválido o sin usuario" },
        { status: 401 }
      )
    }

    const profile = await AuthService.getProfileById(payload.userId)
    if (!profile || !profile.isSuperAdmin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const { customerId, organizationId } = params

    // Remover cliente de organización
    await CustomerOrganizationService.removeCustomerFromOrganization(
      customerId,
      organizationId,
      payload.userId
    )

    return NextResponse.json({
      success: true,
      message: "Cliente removido de la organización exitosamente",
    })
  } catch (error: any) {
    console.error("Error en DELETE /api/administracion/customer-organizations:", error)
    return NextResponse.json(
      { error: error.message || "Error al remover cliente de organización" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string; organizationId: string } }
) {
  try {
    // Autenticación
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-auth-token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Token inválido o sin usuario" },
        { status: 401 }
      )
    }

    const profile = await AuthService.getProfileById(payload.userId)
    if (!profile || !profile.isSuperAdmin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const { customerId, organizationId } = params
    const body = await request.json()

    if (body.action === "set-primary") {
      // Establecer como organización principal
      await CustomerOrganizationService.setPrimaryOrganization(
        customerId,
        organizationId,
        payload.userId
      )

      return NextResponse.json({
        success: true,
        message: "Organización establecida como principal exitosamente",
      })
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Error en PATCH /api/administracion/customer-organizations:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar relación" },
      { status: 500 }
    )
  }
}

