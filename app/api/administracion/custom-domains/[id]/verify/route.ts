import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { CustomDomainService } from '@/lib/services/admin/custom-domain-service'
import { AuthService } from '@/lib/services/auth-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const domain = await CustomDomainService.verifyDomain(id)

    return NextResponse.json({ success: true, domain })
  } catch (error: any) {
    console.error('Error verifying custom domain:', error)
    return NextResponse.json({ error: error.message || 'Error al verificar dominio' }, { status: 500 })
  }
}

