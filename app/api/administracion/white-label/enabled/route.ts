import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { WhiteLabelService } from '@/lib/services/admin/white-label-service'
import { AuthService } from '@/lib/services/auth-service'

export async function GET(request: NextRequest) {
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

    const brandings = await WhiteLabelService.listEnabledBrandings()

    return NextResponse.json({ success: true, brandings })
  } catch (error: any) {
    console.error('Error fetching enabled brandings:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener brandings habilitados' },
      { status: 500 }
    )
  }
}
