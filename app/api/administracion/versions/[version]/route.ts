import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { VersionService } from '@/lib/services/admin/version-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { version: string } }
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

    const { version } = params
    const versionRecord = await VersionService.getVersionByVersion(version)

    if (!versionRecord) {
      return NextResponse.json({ error: 'Versión no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, version: versionRecord })
  } catch (error: any) {
    console.error('Error fetching version:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener versión' },
      { status: 500 }
    )
  }
}
