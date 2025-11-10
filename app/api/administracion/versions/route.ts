import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { VersionService } from '@/lib/services/admin/version-service'
import { AuthService } from '@/lib/services/auth-service'

const createVersionSchema = z.object({
  version: z.string().min(1),
  versionName: z.string().optional(),
  releaseType: z.enum(['major', 'minor', 'patch']).optional(),
  changelog: z.string().min(1),
  releaseNotes: z.string().optional(),
  releaseUrl: z.string().url().optional(),
  downloadUrl: z.string().url().optional(),
  breakingChanges: z.boolean().optional(),
  migrationRequired: z.boolean().optional(),
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
    const isReleasedParam = searchParams.get('isReleased')
    const isReleased = isReleasedParam ? isReleasedParam === 'true' : undefined
    const isCurrentParam = searchParams.get('isCurrent')
    const isCurrent = isCurrentParam ? isCurrentParam === 'true' : undefined

    const versions = await VersionService.getVersions({ isReleased, isCurrent })

    return NextResponse.json({ success: true, versions })
  } catch (error: any) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener versiones' },
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

    const user = await AuthService.getProfileById(payload.userId)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createVersionSchema.parse(body)

    const version = await VersionService.createVersion(validatedData, payload.userId)

    return NextResponse.json({ success: true, version }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating version:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear versión' },
      { status: 500 }
    )
  }
}
