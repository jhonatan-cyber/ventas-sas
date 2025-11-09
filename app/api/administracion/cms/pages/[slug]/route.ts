import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { CmsService } from '@/lib/services/admin/cms-service'
import { z } from 'zod'

const updatePageSchema = z.object({
  organizationId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  pageType: z.string().optional(),
  template: z.string().optional(),
  isPublished: z.boolean().optional(),
  order: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || undefined

    const page = await CmsService.getPageBySlug(slug, organizationId)

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, page })
  } catch (error: any) {
    console.error('Error fetching CMS page:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener página' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

    const { slug } = await params
    const body = await request.json()
    const validatedData = updatePageSchema.parse(body)

    const organizationId = validatedData.organizationId || body.organizationId || undefined
    const page = await CmsService.updatePage(slug, validatedData, payload.userId, organizationId)

    return NextResponse.json({ success: true, page })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating CMS page:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar página' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const organizationIdParam = searchParams.get('organizationId')
    // Convertir string vacío a undefined, mantener null si es "null" explícitamente
    const organizationId = organizationIdParam === '' || organizationIdParam === null 
      ? undefined 
      : organizationIdParam || undefined

    // Primero verificar que la página existe
    const existingPage = await CmsService.getPageBySlug(slug, organizationId)
    if (!existingPage) {
      return NextResponse.json(
        { error: 'Página no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar usando el ID de la página encontrada
    // Usar el organizationId de la página encontrada para asegurar que eliminamos la correcta
    await CmsService.deletePage(slug, existingPage.organizationId || undefined)

    return NextResponse.json({ success: true, message: 'Página eliminada' })
  } catch (error: any) {
    console.error('Error deleting CMS page:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar página' },
      { status: 500 }
    )
  }
}
