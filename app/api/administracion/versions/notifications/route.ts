import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { VersionService } from '@/lib/services/admin/version-service'

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

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || undefined

    const notifications = await VersionService.getVersionNotifications(
      payload.userId,
      organizationId
    )

    return NextResponse.json({ success: true, notifications })
  } catch (error: any) {
    console.error('Error fetching version notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}
