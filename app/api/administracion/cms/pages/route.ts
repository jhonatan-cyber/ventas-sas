import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { CmsService } from '@/lib/services/admin/cms-service'
import { z } from 'zod'

const createPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  pageType: z.string().optional(),
  isPublished: z.boolean().optional(),
  order: z.number().optional(),
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
    const pageType = searchParams.get('pageType') || undefined
    const isPublishedParam = searchParams.get('isPublished')
    const isPublished = isPublishedParam ? isPublishedParam === 'true' : undefined

    const { pages, total } = await CmsService.getPages({ pageType, isPublished })

    return NextResponse.json({ success: true, pages, total })
  } catch (error: any) {
    console.error('Error fetching CMS pages:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener páginas' },
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
    const validatedData = createPageSchema.parse(body)

    const page = await CmsService.createPage(validatedData, payload.userId)

    return NextResponse.json({ success: true, page }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating CMS page:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear página' },
      { status: 500 }
    )
  }
}
