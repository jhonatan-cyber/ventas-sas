import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AbTestService } from '@/lib/services/admin/ab-test-service'
import { AuthService } from '@/lib/services/auth-service'

const createTestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  testType: z.enum(['subscription_plan', 'pricing', 'feature']),
  organizationId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetAudience: z.any().optional(),
  successMetrics: z.any(),
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
    const testType = searchParams.get('testType') || undefined
    const status = searchParams.get('status') || undefined
    const organizationId = searchParams.get('organizationId') || undefined

    const { tests, total } = await AbTestService.getTests({
      testType,
      status,
      organizationId,
    })

    return NextResponse.json({ success: true, tests, total })
  } catch (error: any) {
    console.error('Error fetching AB tests:', error)
    return NextResponse.json({ error: error.message || 'Error al obtener tests A/B' }, { status: 500 })
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

    const user = await AuthService.getProfileById(payload.userId)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createTestSchema.parse(body)

    const test = await AbTestService.createTest(
      {
        name: validatedData.name,
        description: validatedData.description,
        testType: validatedData.testType,
        organizationId: validatedData.organizationId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        targetAudience: validatedData.targetAudience,
        successMetrics: validatedData.successMetrics,
      },
      payload.userId
    )

    return NextResponse.json({ success: true, test }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating AB test:', error)
    return NextResponse.json({ error: error.message || 'Error al crear test A/B' }, { status: 500 })
  }
}

