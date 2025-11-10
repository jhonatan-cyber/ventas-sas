import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { IntegrationService } from '@/lib/services/admin/integration-service'
import { AuthService } from '@/lib/services/auth-service'

const installIntegrationSchema = z.object({
  organizationId: z.string().min(1),
  config: z.any().optional(),
  credentials: z.any().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await AuthService.getProfileById(payload.userId)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = installIntegrationSchema.parse(body)

    const installation = await IntegrationService.installIntegration(
      {
        integrationId: id,
        organizationId: validatedData.organizationId,
        config: validatedData.config,
        credentials: validatedData.credentials,
      },
      payload.userId
    )

    return NextResponse.json({ success: true, installation }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error installing integration:', error)
    return NextResponse.json({ error: error.message || 'Error al instalar integración' }, { status: 500 })
  }
}

