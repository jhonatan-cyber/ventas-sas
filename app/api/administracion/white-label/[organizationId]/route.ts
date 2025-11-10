import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { WhiteLabelService } from '@/lib/services/admin/white-label-service'
import { AuthService } from '@/lib/services/auth-service'

const updateBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  customEmailDomain: z.string().optional(),
  customEmailFrom: z.string().email().optional(),
  companyName: z.string().optional(),
  companyWebsite: z.string().url().optional(),
  customLandingPage: z.any().optional(),
  enabled: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
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

    const { organizationId } = await params
    const branding = await WhiteLabelService.getBranding(organizationId)

    return NextResponse.json({ success: true, branding })
  } catch (error: any) {
    console.error('Error fetching white label branding:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener branding' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
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

    const { organizationId } = await params
    const body = await request.json()
    const validatedData = updateBrandingSchema.parse(body)

    const branding = await WhiteLabelService.updateBranding(organizationId, validatedData)

    return NextResponse.json({ success: true, branding })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating white label branding:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar branding' },
      { status: 500 }
    )
  }
}
