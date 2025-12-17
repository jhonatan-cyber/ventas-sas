import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { CustomDomainService } from '@/lib/services/admin/custom-domain-service'
import { AuthService } from '@/lib/services/auth-service'

const createDomainSchema = z.object({
  organizationId: z.string().min(1),
  domain: z.string().min(1),
  subdomain: z.string().optional(),
  redirectUrl: z.string().url().optional(),
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
    const organizationId = searchParams.get("Organization Id") || undefined

    const { domains, total } = await CustomDomainService.getDomains(organizationId)

    return NextResponse.json({ success: true, domains, total })
  } catch (error: any) {
    console.error('Error fetching custom domains:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener dominios' }, { status: 500 })
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
    const validatedData = createDomainSchema.parse(body)

    const domain = await CustomDomainService.createDomain(validatedData)

    return NextResponse.json({ success: true, domain }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating custom domain:', error)
    return NextResponse.json({ error: error.message || 'Error al crear dominio' }, { status: 500 })
  }
}

