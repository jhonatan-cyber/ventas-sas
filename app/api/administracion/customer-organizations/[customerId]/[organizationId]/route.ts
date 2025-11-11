import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { CustomerOrganizationService } from "@/lib/services/admin/customer-organization-service"
import { AuthService } from "@/lib/services/auth-service"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string; organizationId: string }> }
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

    const { customerId, organizationId } = await params

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
  _request: NextRequest,
  { params: _params }: { params: Promise<{ customerId: string; organizationId: string }> }
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

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Error en PATCH /api/administracion/customer-organizations:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar relación" },
      { status: 500 }
    );
  }
}

