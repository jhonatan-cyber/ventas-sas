import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AbTestService } from '@/lib/services/admin/ab-test-service'
import { AuthService } from '@/lib/services/auth-service'

export async function GET(
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
    const test = await AbTestService.getTestById(id)

    if (!test) {
      return NextResponse.json({ error: 'Test no encontrado' }, { status: 404 })
    }

    const stats = await AbTestService.getTestStats(id)

    return NextResponse.json({ success: true, test, stats })
  } catch (error: any) {
    console.error('Error fetching AB test:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener test A/B' }, { status: 500 })
  }
}

