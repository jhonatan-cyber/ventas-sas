import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { FeedbackService } from '@/lib/services/admin/feedback-service'
import { AuthService } from '@/lib/services/auth-service'

const createFeedbackSchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  userType: z.string().optional(),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
})

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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const organizationId = searchParams.get('organizationId') || undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : undefined

    const { feedbacks, total, page: currentPage, pageSize: currentPageSize } = await FeedbackService.getFeedbacks({
      category,
      status,
      priority,
      organizationId,
      page,
      pageSize,
    })

    return NextResponse.json({ success: true, feedbacks, total, page: currentPage, pageSize: currentPageSize })
  } catch (error: any) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener feedbacks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createFeedbackSchema.parse(body)

    const feedback = await FeedbackService.createFeedback(validatedData)

    return NextResponse.json({ success: true, feedback }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear feedback' },
      { status: 500 }
    )
  }
}
