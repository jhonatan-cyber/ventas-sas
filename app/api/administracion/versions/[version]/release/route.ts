import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { VersionService } from '@/lib/services/admin/version-service'
import { AuthService } from '@/lib/services/auth-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
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

    const { version } = await params
    const versionRecord = await VersionService.releaseVersion(version, payload.userId)

    return NextResponse.json({ success: true, version: versionRecord })
  } catch (error: any) {
    console.error('Error releasing version:', error)
    return NextResponse.json(
      { error: error.message || 'Error al liberar versión' },
      { status: 500 }
    )
  }
}
