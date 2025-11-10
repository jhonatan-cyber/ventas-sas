import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { FeedbackService } from '@/lib/services/admin/feedback-service'
import { AuthService } from '@/lib/services/auth-service'

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
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const { userType } = body

    const result = await FeedbackService.voteFeedback(id, payload.userId, userType || 'admin')

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Error voting feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Error al votar feedback' },
      { status: 500 }
    )
  }
}
