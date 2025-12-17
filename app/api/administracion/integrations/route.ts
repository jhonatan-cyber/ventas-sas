import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { IntegrationService } from '@/lib/services/admin/integration-service'
import { AuthService } from '@/lib/services/auth-service'

const createIntegrationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  iconUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  requiresConfig: z.boolean().optional(),
  configSchema: z.any().optional(),
  installationSteps: z.any().optional(),
  version: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-auth-token")?.value

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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("Category") || undefined
    const isActive = searchParams.get("Is Active") === 'true'
    const isPublic = searchParams.get("Is Public") === 'true' ? true : undefined

    const { integrations, total } = await IntegrationService.getIntegrations({
      category,
      isActive: isActive || undefined,
      isPublic,
    })

    return NextResponse.json({ success: true, integrations, total })
  } catch (error: any) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener integraciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-auth-token")?.value

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

    const body = await request.json()
    const validatedData = createIntegrationSchema.parse(body)

    const integration = await IntegrationService.createIntegration(validatedData, payload.userId)

    return NextResponse.json({ success: true, integration }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating integration:', error)
    return NextResponse.json({ error: error.message || 'Error al crear integración' }, { status: 500 })
  }
}

