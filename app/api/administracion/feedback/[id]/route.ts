import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { FeedbackService } from '@/lib/services/admin/feedback-service'
import { z } from 'zod'

const updateFeedbackSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'rejected']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  adminNotes: z.string().optional(),
  completedBy: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params
    const feedback = await FeedbackService.getFeedbackById(id)

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, feedback })
  } catch (error: any) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener feedback' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params
    const body = await request.json()
    const validatedData = updateFeedbackSchema.parse(body)

    if (validatedData.completedBy === undefined && validatedData.status === 'completed') {
      validatedData.completedBy = payload.userId
    }

    const feedback = await FeedbackService.updateFeedback(id, validatedData)

    return NextResponse.json({ success: true, feedback })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar feedback' },
      { status: 500 }
    )
  }
}
