import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CustomerOrganizationService } from "@/lib/services/admin/customer-organization-service"
import { AdminJWTService } from "@/lib/auth/admin-jwt"
import { AuthService } from "@/lib/services/auth-service"
import { cookies } from "next/headers"

const addCustomerSchema = z.object({
  customerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
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

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customerId")
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    if (customerId) {
      // Obtener organizaciones de un cliente específico
      const organizations = await CustomerOrganizationService.getCustomerOrganizations(
        customerId
      )
      return NextResponse.json({ success: true, organizations })
    }

    if (organizationId) {
      // Obtener clientes de una organización específica
      const customers = await CustomerOrganizationService.getOrganizationCustomers(
        organizationId
      )
      return NextResponse.json({ success: true, customers })
    }

    // Obtener todos los clientes con sus organizaciones
    const result = await CustomerOrganizationService.getAllCustomersWithOrganizations({
      search,
      page,
      pageSize,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error("Error en GET /api/administracion/customer-organizations:", error)
    return NextResponse.json(
      { error: error.message || "Error al obtener datos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Validar body
    const body = await request.json()
    console.log("POST /api/administracion/customer-organizations - Body recibido:", body)
    
    const validatedData = addCustomerSchema.parse(body)
    console.log("POST /api/administracion/customer-organizations - Datos validados:", validatedData)

    // Agregar cliente a organización
    const customerOrganization = await CustomerOrganizationService.addCustomerToOrganization(
      validatedData,
      payload.userId
    )
    console.log("POST /api/administracion/customer-organizations - Relación creada:", customerOrganization)

    return NextResponse.json({
      success: true,
      customerOrganization,
    })
  } catch (error: any) {
    console.error("Error en POST /api/administracion/customer-organizations:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Error al agregar cliente a organización" },
      { status: 500 }
    )
  }
}

